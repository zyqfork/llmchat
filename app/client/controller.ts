// To store message streaming controller
export const ChatControllerPool = {
  controllers: {} as Record<string, AbortController>,
  // 添加控制器状态跟踪，避免重复操作
  controllerStates: {} as Record<string, "active" | "aborted" | "completed">,
  // 添加控制器元数据，用于多模型场景
  controllerMetadata: {} as Record<
    string,
    {
      sessionId: string;
      messageId: string;
      modelKey?: string; // 多模型模式下的模型标识
      createdAt: number;
    }
  >,

  addController(
    sessionId: string,
    messageId: string,
    controller: AbortController,
    modelKey?: string,
  ) {
    const key = this.key(sessionId, messageId);

    // 如果已存在控制器，先清理旧的
    if (this.controllers[key]) {
      this.remove(sessionId, messageId);
    }

    this.controllers[key] = controller;
    this.controllerStates[key] = "active";
    this.controllerMetadata[key] = {
      sessionId,
      messageId,
      modelKey,
      createdAt: Date.now(),
    };

    // 监听控制器中止事件
    controller.signal.addEventListener("abort", () => {
      this.controllerStates[key] = "aborted";
    });

    return key;
  },

  stop(sessionId: string, messageId: string) {
    const key = this.key(sessionId, messageId);
    const controller = this.controllers[key];

    // 只有在控制器处于活动状态时才中止
    if (controller && this.controllerStates[key] === "active") {
      try {
        controller.abort();
        this.controllerStates[key] = "aborted";
      } catch (error) {
        console.error("[ChatControllerPool] Error aborting controller:", error);
        // 即使中止失败，也标记为中止状态
        this.controllerStates[key] = "aborted";
      }
    }
  },

  stopAll() {
    const errors: string[] = [];
    Object.entries(this.controllers).forEach(([key, controller]) => {
      if (this.controllerStates[key] === "active") {
        try {
          controller.abort();
          this.controllerStates[key] = "aborted";
        } catch (error) {
          console.error(
            `[ChatControllerPool] Error aborting controller ${key}:`,
            error,
          );
          errors.push(`Controller ${key}: ${error}`);
          // 即使中止失败，也标记为中止状态
          this.controllerStates[key] = "aborted";
        }
      }
    });

    if (errors.length > 0) {
      console.warn(
        `[ChatControllerPool] Some controllers failed to abort: ${errors.join(
          ", ",
        )}`,
      );
    }
  },

  stopAllInSession(sessionId: string) {
    const errors: string[] = [];
    Object.entries(this.controllers).forEach(([key, controller]) => {
      const metadata = this.controllerMetadata[key];
      if (
        metadata?.sessionId === sessionId &&
        this.controllerStates[key] === "active"
      ) {
        try {
          controller.abort();
          this.controllerStates[key] = "aborted";
        } catch (error) {
          console.error(
            `[ChatControllerPool] Error aborting session controller ${key}:`,
            error,
          );
          errors.push(`Session Controller ${key}: ${error}`);
          this.controllerStates[key] = "aborted";
        }
      }
    });

    if (errors.length > 0) {
      console.warn(
        `[ChatControllerPool] Some session controllers failed to abort: ${errors.join(
          ", ",
        )}`,
      );
    }
  },

  hasPending() {
    return Object.values(this.controllerStates).some(
      (state) => state === "active",
    );
  },

  hasPendingInSession(sessionId: string) {
    return Object.entries(this.controllerStates).some(([key, state]) => {
      const metadata = this.controllerMetadata[key];
      return metadata?.sessionId === sessionId && state === "active";
    });
  },

  remove(sessionId: string, messageId: string) {
    const key = this.key(sessionId, messageId);

    // 清理控制器和中止信号监听器
    const controller = this.controllers[key];
    if (controller) {
      // 如果控制器还在活动状态，先中止它
      if (this.controllerStates[key] === "active") {
        try {
          controller.abort();
        } catch (error) {
          console.error(
            `[ChatControllerPool] Error aborting controller on remove:`,
            error,
          );
        }
      }
      delete this.controllers[key];
      delete this.controllerStates[key];
      delete this.controllerMetadata[key];
    }
  },

  key(sessionId: string, messageIndex: string) {
    return `${sessionId},${messageIndex}`;
  },

  // 标记控制器为完成状态
  markCompleted(sessionId: string, messageId: string) {
    const key = this.key(sessionId, messageId);
    if (this.controllerStates[key]) {
      this.controllerStates[key] = "completed";
    }
  },

  // 获取控制器状态
  getControllerState(
    sessionId: string,
    messageId: string,
  ): "active" | "aborted" | "completed" | undefined {
    const key = this.key(sessionId, messageId);
    return this.controllerStates[key];
  },

  // 清理过期控制器（超过5分钟的控制器）
  cleanupExpiredControllers(maxAge: number = 5 * 60 * 1000) {
    const now = Date.now();
    const expiredKeys: string[] = [];

    Object.entries(this.controllerMetadata).forEach(([key, metadata]) => {
      if (now - metadata.createdAt > maxAge) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => {
      const controller = this.controllers[key];
      if (controller && this.controllerStates[key] === "active") {
        try {
          controller.abort();
        } catch (error) {
          console.error(
            `[ChatControllerPool] Error aborting expired controller:`,
            error,
          );
        }
      }
      delete this.controllers[key];
      delete this.controllerStates[key];
      delete this.controllerMetadata[key];
    });

    if (expiredKeys.length > 0) {
      console.log(
        `[ChatControllerPool] Cleaned up ${expiredKeys.length} expired controllers`,
      );
    }
  },
};
