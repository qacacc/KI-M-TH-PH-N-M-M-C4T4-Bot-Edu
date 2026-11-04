import { describe, expect, it } from "vitest";
import { createMessageId, welcomeMessage } from "./useChatSession";

describe("useChatSession helpers", () => {
  it("welcomeMessage có cấu trúc hợp lệ và vai trò assistant", () => {
    expect(welcomeMessage.id).toBe("welcome");
    expect(welcomeMessage.role).toBe("assistant");
    expect(welcomeMessage.content).toContain("v1.0.1");
  });

  it("createMessageId tạo id duy nhất và không rỗng", () => {
    const id1 = createMessageId();
    const id2 = createMessageId();
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });
});
