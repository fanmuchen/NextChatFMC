import { NextRequest } from "next/server";
import { verifyAuthentication } from "../../../utils/auth-middleware";
import { generateEncryptionKey } from "../../../utils/encryption";
import { logToElastic } from "../../../api/logging-middleware";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log("开始处理加密密钥请求");

    // 验证用户是否已登录
    const authResult = await verifyAuthentication(request);

    if (!authResult.isAuthenticated || !authResult.userId) {
      console.warn("未授权的加密密钥请求", {
        isAuthenticated: authResult.isAuthenticated,
        userId: authResult.userId,
        path: request.nextUrl.pathname,
      });

      // Log unauthorized attempt to Elasticsearch
      await logToElastic(request, {
        status: 401,
        statusText: "Unauthorized",
        responseTime: Date.now() - startTime,
        level: "warn",
        route: "auth/encryption-key",
        isLogged: false,
        userId: "anonymous",
        method: request.method,
        path: request.nextUrl.pathname,
        event: "encryption_key_request",
        result: "unauthorized",
      });

      return new Response(JSON.stringify({ error: "未授权，请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("用户已认证，生成加密密钥", {
      userId: authResult.userId,
      username: authResult.userInfo?.name,
    });

    // 生成加密密钥
    const encryptionKey = generateEncryptionKey();

    // Log successful key generation to Elasticsearch
    await logToElastic(request, {
      status: 200,
      statusText: "OK",
      responseTime: Date.now() - startTime,
      level: "info",
      route: "auth/encryption-key",
      isLogged: true,
      userId: authResult.userId,
      userName: authResult.userInfo?.name,
      method: request.method,
      path: request.nextUrl.pathname,
      event: "encryption_key_generation",
      result: "success",
    });

    return new Response(JSON.stringify({ encryptionKey }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("生成加密密钥过程中出错:", error);

    // Log error to Elasticsearch
    await logToElastic(request, {
      status: 500,
      statusText: "Internal Server Error",
      responseTime: Date.now() - startTime,
      level: "error",
      route: "auth/encryption-key",
      isLogged: false,
      userId: "unknown",
      userName: "unknown",
      method: request.method,
      path: request.nextUrl.pathname,
      event: "encryption_key_generation",
      result: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return new Response(
      JSON.stringify({
        error: "服务器内部错误",
        message: error instanceof Error ? error.message : "未知错误",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
