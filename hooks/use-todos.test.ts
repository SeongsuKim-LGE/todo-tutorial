import { act, renderHook, waitFor } from "@testing-library/react";
import { useTodos } from "@/hooks/use-todos";

beforeEach(() => {
  localStorage.clear();
});

describe("useTodos 우선순위", () => {
  it("addTodo에 전달한 우선순위로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "high");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "장보기",
      priority: "high",
      completed: false,
    });
  });

  it("우선순위를 생략하면 기본값(medium)으로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("priority가 없는 기존 저장 데이터는 medium으로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([{ id: "1", text: "구버전 할 일", completed: false }])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].priority).toBe("medium");
  });

  it("추가한 우선순위를 localStorage에 저장한다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("장보기", "low");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored[0]?.priority).toBe("low");
    });
  });
});

describe("useTodos 마감일", () => {
  it("addTodo에 전달한 마감일로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의", "medium", "2026-07-01");
    });

    expect(result.current.todos[0]).toMatchObject({
      text: "회의",
      dueDate: "2026-07-01",
    });
  });

  it("마감일을 생략하면 dueDate 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].dueDate).toBeUndefined();
  });

  it("새로 추가한 Todo에는 생성 시각(createdAt)이 기록된다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("회의");
    });

    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });

  it("createdAt이 없는 기존 데이터는 number로 보정해 로드한다", async () => {
    localStorage.setItem(
      "todos",
      JSON.stringify([
        { id: "1", text: "구버전 할 일", completed: false, priority: "medium" },
      ])
    );

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(typeof result.current.todos[0].createdAt).toBe("number");
  });
});

describe("useTodos 카테고리", () => {
  it("addTodo에 전달한 카테고리로 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("보고서", "medium", undefined, "work");
    });

    expect(result.current.todos[0].category).toBe("work");
  });

  it("카테고리를 생략하면 category 없이 추가한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("청소");
    });

    expect(result.current.todos[0].category).toBeUndefined();
  });
});

describe("useTodos 손상 데이터 보호", () => {
  it("파싱할 수 없는 저장값을 빈 배열로 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    // 손상된 원본이 보존돼 복구 여지가 남아야 한다
    expect(localStorage.getItem("todos")).toBe("{이건 JSON이 아님");
  });

  it("배열이 아닌 저장값도 덮어쓰지 않는다", async () => {
    localStorage.setItem("todos", JSON.stringify({ x: 1 }));

    const { result } = renderHook(() => useTodos());

    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.todos).toEqual([]);
    expect(localStorage.getItem("todos")).toBe('{"x":1}');
  });

  it("손상 데이터 로드 후 새 항목을 추가하면 정상적으로 저장된다", async () => {
    localStorage.setItem("todos", "{이건 JSON이 아님");

    const { result } = renderHook(() => useTodos());
    await waitFor(() => expect(result.current.loaded).toBe(true));

    act(() => {
      result.current.addTodo("새 할 일");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "null");
      expect(Array.isArray(stored)).toBe(true);
      expect(stored[0]?.text).toBe("새 할 일");
    });
  });
});

describe("useTodos 편집(editTodo)", () => {
  it("텍스트만 변경하고 나머지 필드는 그대로 보존한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("원본 텍스트", "high", "2026-07-01", "work");
    });
    const before = result.current.todos[0];

    act(() => {
      result.current.editTodo(before.id, "수정된 텍스트");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0]).toEqual({
      ...before,
      text: "수정된 텍스트",
    });
  });

  it("다른 항목의 텍스트에는 영향을 주지 않는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("A");
    });
    act(() => {
      result.current.addTodo("B");
    });
    const idA = result.current.todos.find((todo) => todo.text === "A")!.id;
    const idB = result.current.todos.find((todo) => todo.text === "B")!.id;

    act(() => {
      result.current.editTodo(idB, "B 수정");
    });

    expect(result.current.todos.find((todo) => todo.id === idA)?.text).toBe(
      "A"
    );
    expect(result.current.todos.find((todo) => todo.id === idB)?.text).toBe(
      "B 수정"
    );
  });

  it("편집한 내용을 localStorage에 반영한다", async () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("원본");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "수정본");
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("todos") ?? "[]");
      expect(stored[0]?.text).toBe("수정본");
    });
  });

  it("앞뒤 공백은 trim해서 저장한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("원본");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "  다듬은 텍스트  ");
    });

    expect(result.current.todos[0].text).toBe("다듬은 텍스트");
  });

  it("빈 문자열로 편집하면 해당 항목을 삭제한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("삭제될 항목");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.editTodo(id, "");
    });

    expect(result.current.todos).toHaveLength(0);
  });

  it("공백만 있는 문자열로 편집해도 삭제 처리하고 다른 항목은 남긴다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("A");
    });
    act(() => {
      result.current.addTodo("B");
    });
    const idA = result.current.todos.find((todo) => todo.text === "A")!.id;

    act(() => {
      result.current.editTodo(idA, "   ");
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe("B");
  });
});

describe("useTodos 토글/삭제 정확성", () => {
  it("toggleTodo는 지정한 id의 항목만 완료 상태를 뒤집는다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("A");
    });
    act(() => {
      result.current.addTodo("B");
    });
    act(() => {
      result.current.addTodo("C");
    });
    const idB = result.current.todos.find((todo) => todo.text === "B")!.id;

    act(() => {
      result.current.toggleTodo(idB);
    });

    const byText = (text: string) =>
      result.current.todos.find((todo) => todo.text === text);
    expect(byText("B")?.completed).toBe(true);
    expect(byText("A")?.completed).toBe(false);
    expect(byText("C")?.completed).toBe(false);
  });

  it("toggleTodo를 같은 id로 두 번 호출하면 원래 상태로 되돌아온다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("A");
    });
    const id = result.current.todos[0].id;

    act(() => {
      result.current.toggleTodo(id);
    });
    act(() => {
      result.current.toggleTodo(id);
    });

    expect(result.current.todos[0].completed).toBe(false);
  });

  it("deleteTodo는 지정한 id의 항목만 제거하고 나머지 순서를 유지한다", () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo("A");
    });
    act(() => {
      result.current.addTodo("B");
    });
    act(() => {
      result.current.addTodo("C");
    });
    // addTodo는 배열 앞에 추가하므로 현재 순서는 [C, B, A]
    const idB = result.current.todos.find((todo) => todo.text === "B")!.id;

    act(() => {
      result.current.deleteTodo(idB);
    });

    expect(result.current.todos.map((todo) => todo.text)).toEqual([
      "C",
      "A",
    ]);
  });
});
