import { logtoConfig } from "../logto";

/**
 * 获取 Logto Management API 访问令牌
 * @returns Promise<string> 访问令牌
 */
export async function getManagementApiToken(): Promise<string> {
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

/**
 * 验证用户密码
 * @param userId 用户ID
 * @param password 密码
 * @returns Promise<boolean> 验证结果
 */
export async function verifyUserPassword(
  userId: string,
  password: string,
): Promise<boolean> {
  try {
    const managementApiToken = await getManagementApiToken();
    const verifyPasswordEndpoint = `${logtoConfig.endpoint.replace(
      /\/$/,
      "",
    )}/api/users/${userId}/password/verify`;

    const verifyPasswordResponse = await fetch(verifyPasswordEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${managementApiToken}`,
      },
      body: JSON.stringify({ password }),
    });

    return verifyPasswordResponse.ok;
  } catch (error) {
    console.error("验证用户密码时出错:", error);
    throw error;
  }
}

/**
 * 更新用户密码
 * @param userId 用户ID
 * @param newPassword 新密码
 * @returns Promise<void>
 */
export async function updateUserPassword(
  userId: string,
  newPassword: string,
): Promise<void> {
  try {
    const managementApiToken = await getManagementApiToken();
    const updatePasswordEndpoint = `${logtoConfig.endpoint.replace(
      /\/$/,
      "",
    )}/api/users/${userId}/password`;

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
        userId,
      });
      throw new Error(`密码更新失败: ${JSON.stringify(errorData)}`);
    }
  } catch (error) {
    console.error("更新用户密码时出错:", error);
    throw error;
  }
}
