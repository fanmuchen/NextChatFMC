import { NextRequest } from "next/server";
import { verifyAuthentication } from "../../../utils/auth-middleware";
import { logToElastic } from "../../../api/logging-middleware";
import {
  verifyUserPassword,
  updateUserPassword,
} from "../../../utils/logto-management-api";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log("开始处理密码修改请求");

    // 验证用户是否已登录
    const authResult = await verifyAuthentication(request);

    if (!authResult.isAuthenticated || !authResult.userId) {
      console.warn("未授权的密码修改请求", {
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
        route: "auth/change-password",
        isLogged: false,
        userId: "anonymous",
        method: request.method,
        path: request.nextUrl.pathname,
        event: "password_change_attempt",
        result: "unauthorized",
      });

      return new Response(JSON.stringify({ error: "未授权，请先登录" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("用户已认证，继续处理密码修改", {
      userId: authResult.userId,
      username: authResult.userInfo?.name,
    });

    // 解析请求体
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      console.warn("密码修改请求缺少必要参数", {
        hasCurrentPassword: !!currentPassword,
        hasNewPassword: !!newPassword,
        userId: authResult.userId,
      });
      return new Response(
        JSON.stringify({ error: "当前密码和新密码不能为空" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 1. 首先验证当前密码
    console.log("正在验证当前密码");
    const isPasswordValid = await verifyUserPassword(
      authResult.userId,
      currentPassword,
    );

    if (!isPasswordValid) {
      console.warn("当前密码验证失败", {
        userId: authResult.userId,
      });
      return new Response(JSON.stringify({ error: "当前密码不正确" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("当前密码验证成功");

    // 2. 更新密码
    console.log("正在更新密码");
    await updateUserPassword(authResult.userId, newPassword);

    console.log("密码更新成功", {
      userId: authResult.userId,
      username: authResult.userInfo?.name,
    });

    // Log successful password change to Elasticsearch
    await logToElastic(request, {
      status: 200,
      statusText: "OK",
      responseTime: Date.now() - startTime,
      level: "info",
      route: "auth/change-password",
      isLogged: true,
      userId: authResult.userId,
      userName: authResult.userInfo?.name,
      method: request.method,
      path: request.nextUrl.pathname,
      event: "password_change",
      result: "success",
    });

    return new Response(
      JSON.stringify({ success: true, message: "密码已成功更新" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("密码修改过程中出错:", error);

    // Log error to Elasticsearch
    await logToElastic(request, {
      status: 500,
      statusText: "Internal Server Error",
      responseTime: Date.now() - startTime,
      level: "error",
      route: "auth/change-password",
      isLogged: false,
      userId: "unknown",
      userName: "unknown",
      method: request.method,
      path: request.nextUrl.pathname,
      event: "password_change",
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
