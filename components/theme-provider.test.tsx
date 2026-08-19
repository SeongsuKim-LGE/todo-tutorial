import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/components/theme-provider";

const setTheme = vi.fn();
let resolvedTheme = "light";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ resolvedTheme, setTheme }),
}));

beforeEach(() => {
  setTheme.mockClear();
  resolvedTheme = "light";
});

describe("ThemeProvider 단축키 ('d' 키로 다크모드 토글)", () => {
  it("'d' 키를 누르면 라이트 모드에서 다크 모드로 전환한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d" });

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("다크 모드일 때 'd' 키를 누르면 라이트 모드로 전환한다", () => {
    resolvedTheme = "dark";
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d" });

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("light");
  });

  it("대문자 'D'도 동일하게 토글한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "D" });

    expect(setTheme).toHaveBeenCalledExactlyOnceWith("dark");
  });

  it("d가 아닌 다른 키는 무시한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "a" });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("Ctrl/Meta/Alt 조합키와 함께 누르면 무시한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d", ctrlKey: true });
    fireEvent.keyDown(window, { key: "d", metaKey: true });
    fireEvent.keyDown(window, { key: "d", altKey: true });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("키를 누르고 있을 때 발생하는 반복 입력(repeat)은 무시한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    fireEvent.keyDown(window, { key: "d", repeat: true });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("이미 다른 핸들러가 처리한(defaultPrevented) 이벤트는 무시한다", () => {
    render(
      <ThemeProvider>
        <div>content</div>
      </ThemeProvider>
    );

    const event = new KeyboardEvent("keydown", {
      key: "d",
      bubbles: true,
      cancelable: true,
    });
    event.preventDefault();
    window.dispatchEvent(event);

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("input에 포커스된 상태에서 입력하면 무시한다", () => {
    render(
      <ThemeProvider>
        <input aria-label="테스트 입력" />
      </ThemeProvider>
    );

    fireEvent.keyDown(screen.getByLabelText("테스트 입력"), { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("textarea에 포커스된 상태에서 입력하면 무시한다", () => {
    render(
      <ThemeProvider>
        <textarea aria-label="테스트 텍스트영역" />
      </ThemeProvider>
    );

    fireEvent.keyDown(screen.getByLabelText("테스트 텍스트영역"), {
      key: "d",
    });

    expect(setTheme).not.toHaveBeenCalled();
  });

  it("contentEditable 요소에 포커스된 상태에서 입력하면 무시한다", () => {
    render(
      <ThemeProvider>
        <div contentEditable aria-label="편집 가능 영역" />
      </ThemeProvider>
    );

    const editable = screen.getByLabelText("편집 가능 영역");
    // jsdom은 isContentEditable getter를 구현하지 않으므로 실제 브라우저 동작을 재현하기 위해 직접 스텁한다.
    Object.defineProperty(editable, "isContentEditable", {
      value: true,
      configurable: true,
    });

    fireEvent.keyDown(editable, { key: "d" });

    expect(setTheme).not.toHaveBeenCalled();
  });
});
