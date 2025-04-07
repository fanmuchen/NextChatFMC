import { NextRequest } from "next/server";
import { logtoConfig } from "../../../logto";
import { verifyAuthentication } from "../../../utils/auth-middleware";
import { logToElastic } from "../../../api/logging-middleware";

// Force this route to be dynamically rendered at runtime
export const dynamic = "force-dynamic";

// 获取 Management API 访问令牌
async function getManagementApiToken() {
  const m2mAppId = process.env.LOGTO_M2M_APP_ID;
  const m2mAppSecret = process.env.LOGTO_M2M_APP_SECRET;

  if (!m2mAppId || !m2mAppSecret) {
    console.error("M2M 应用程序凭据未配置", {
      m2mAppId: m2mAppId ? "已设置" : "未设置",
      m2mAppSecret: m2mAppSecret ? "已设置" : "未设置",
      env: process.env.NODE_ENV,
    });
    throw new Error("M2M 应用程序凭据未配置");
  }

  try {
    console.log("正在获取 Management API 令牌...");
    const tokenEndpoint = `${logtoConfig.endpoint.replace(
      /\/$/,
      "",
    )}/oidc/token`;
    console.log(`令牌端点: ${tokenEndpoint}`);

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: m2mAppId,
        client_secret: m2mAppSecret,
        resource: "https://default.logto.app/api",
        scope: "all",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("获取 Management API 令牌失败", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(
        `获取 Management API 令牌失败: ${JSON.stringify(errorData)}`,
      );
    }

    const data = await response.json();
    console.log("成功获取 Management API 令牌");
    return data.access_token;
  } catch (error) {
    console.error("获取 Management API 令牌时出错:", error);
    throw error;
  }
}

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

    // 获取 Management API 访问令牌
    console.log("正在获取 Management API 访问令牌");
    const managementApiToken = await getManagementApiToken();
    console.log("成功获取 Management API 访问令牌");

    // 1. 首先验证当前密码
    console.log("正在验证当前密码");
    const verifyPasswordEndpoint = `${logtoConfig.endpoint.replace(
      /\/$/,
      "",
    )}/api/users/${authResult.userId}/password/verify`;
    console.log(`验证密码端点: ${verifyPasswordEndpoint}`);

    const verifyPasswordResponse = await fetch(verifyPasswordEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementApiToken}`,
      },
      body: JSON.stringify({ password: currentPassword }),
    });

    if (!verifyPasswordResponse.ok) {
      console.warn("当前密码验证失败", {
        status: verifyPasswordResponse.status,
        statusText: verifyPasswordResponse.statusText,
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
    const updatePasswordEndpoint = `${logtoConfig.endpoint.replace(
      /\/$/,
      "",
    )}/api/users/${authResult.userId}/password`;
    console.log(`更新密码端点: ${updatePasswordEndpoint}`);

    const updatePasswordResponse = await fetch(updatePasswordEndpoint, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementApiToken}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!updatePasswordResponse.ok) {
      const errorData = await updatePasswordResponse.json();
      console.error("密码更新失败", {
        status: updatePasswordResponse.status,
        statusText: updatePasswordResponse.statusText,
        error: errorData,
        userId: authResult.userId,
      });
      return new Response(
        JSON.stringify({ error: "密码更新失败", details: errorData }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

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

    // 密码更新成功
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
