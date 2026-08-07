import { describe, expect, it, vi } from "vitest";
import { gitlabActions } from "./actions.ts";
import { gitlabActionHandlers } from "./executors.ts";

const context = (fetcher: typeof fetch) => ({
  apiKey: "test-token",
  apiBaseUrl: "https://gitlab.example.com/api/v4",
  fetcher,
});

function jsonFetcher(payload: unknown, options: ResponseInit = {}): typeof fetch {
  return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json(payload, options));
}

function actionNames(): string[] {
  return gitlabActions.map((action) => action.name);
}

describe("GitLab project operations", () => {
  it("declares the long-term project operation actions", () => {
    expect(actionNames()).toEqual(
      expect.arrayContaining([
        "update_project",
        "list_project_labels",
        "create_project_label",
        "update_project_label",
        "delete_project_label",
        "list_project_pipelines",
        "get_project_pipeline",
        "retry_project_pipeline",
        "cancel_project_pipeline",
        "list_project_pipeline_jobs",
        "list_project_releases",
        "get_project_release",
        "create_project_release",
        "update_project_release",
        "delete_project_release",
      ]),
    );
  });

  it("updates project metadata with GitLab field names", async () => {
    const fetcher = jsonFetcher({ id: 42, description: "Long-lived project" });

    await gitlabActionHandlers.update_project!(
      {
        projectId: "group%2Fproject",
        description: "Long-lived project",
        topics: ["automation", "platform"],
        visibility: "private",
      },
      context(fetcher),
    );

    expect(fetcher).toHaveBeenCalledOnce();
    const [url, init] = vi.mocked(fetcher).mock.calls[0]!;
    expect(String(url)).toBe("https://gitlab.example.com/api/v4/projects/group%2Fproject");
    expect(init).toMatchObject({ method: "PUT" });
    expect(JSON.parse(String(init?.body))).toEqual({
      description: "Long-lived project",
      topics: ["automation", "platform"],
      visibility: "private",
    });
  });
});

describe("GitLab project labels", () => {
  it("lists labels with pagination and search filters", async () => {
    const fetcher: typeof fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      Response.json([{ id: 7, name: "bug" }], {
        headers: { "x-total": "1", "x-next-page": "" },
      }),
    );

    await expect(
      gitlabActionHandlers.list_project_labels!(
        { projectId: "42", search: "bug", page: 2, perPage: 25 },
        context(fetcher),
      ),
    ).resolves.toEqual({ labels: [{ id: 7, name: "bug" }], total: 1, nextPage: null });
    expect(String(vi.mocked(fetcher).mock.calls[0]![0])).toBe(
      "https://gitlab.example.com/api/v4/projects/42/labels?search=bug&page=2&per_page=25",
    );
  });

  it("creates, updates, and deletes labels", async () => {
    const fetcher = jsonFetcher({ id: 7, name: "priority" });
    const ctx = context(fetcher);

    await gitlabActionHandlers.create_project_label!(
      { projectId: "42", name: "priority", color: "#ff0000", description: "Important" },
      ctx,
    );
    await gitlabActionHandlers.update_project_label!(
      { projectId: "42", labelId: "priority", newName: "urgent", color: "#cc0000" },
      ctx,
    );
    await gitlabActionHandlers.delete_project_label!({ projectId: "42", labelId: "urgent" }, ctx);

    const requests = vi.mocked(fetcher).mock.calls.map(([url, init]) => ({
      url: String(url),
      method: init?.method,
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    }));
    expect(requests).toEqual([
      {
        url: "https://gitlab.example.com/api/v4/projects/42/labels",
        method: "POST",
        body: { name: "priority", color: "#ff0000", description: "Important" },
      },
      {
        url: "https://gitlab.example.com/api/v4/projects/42/labels/priority",
        method: "PUT",
        body: { new_name: "urgent", color: "#cc0000" },
      },
      {
        url: "https://gitlab.example.com/api/v4/projects/42/labels/urgent",
        method: "DELETE",
        body: undefined,
      },
    ]);
  });
});

describe("GitLab project pipelines", () => {
  it("lists pipelines, gets one, retries it, cancels it, and lists its jobs", async () => {
    const fetcher: typeof fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/jobs")) return Response.json([{ id: 12, name: "test" }]);
      if (url.endsWith("/pipelines?status=failed&ref=main&page=1&per_page=20")) {
        return Response.json([{ id: 9, status: "failed" }], { headers: { "x-total": "1" } });
      }
      return Response.json({ id: 9, status: "running" });
    });
    const ctx = context(fetcher);

    await expect(
      gitlabActionHandlers.list_project_pipelines!(
        { projectId: "42", status: "failed", ref: "main", page: 1, perPage: 20 },
        ctx,
      ),
    ).resolves.toMatchObject({ pipelines: [{ id: 9, status: "failed" }], total: 1 });
    await gitlabActionHandlers.get_project_pipeline!({ projectId: "42", pipelineId: 9 }, ctx);
    await gitlabActionHandlers.retry_project_pipeline!({ projectId: "42", pipelineId: 9 }, ctx);
    await gitlabActionHandlers.cancel_project_pipeline!({ projectId: "42", pipelineId: 9 }, ctx);
    await expect(
      gitlabActionHandlers.list_project_pipeline_jobs!(
        { projectId: "42", pipelineId: 9, scope: ["failed", "success"], includeRetried: true },
        ctx,
      ),
    ).resolves.toMatchObject({ jobs: [{ id: 12, name: "test" }] });

    expect(vi.mocked(fetcher).mock.calls.map(([url, init]) => [String(url), init?.method ?? "GET"])).toEqual([
      ["https://gitlab.example.com/api/v4/projects/42/pipelines?status=failed&ref=main&page=1&per_page=20", "GET"],
      ["https://gitlab.example.com/api/v4/projects/42/pipelines/9", "GET"],
      ["https://gitlab.example.com/api/v4/projects/42/pipelines/9/retry", "POST"],
      ["https://gitlab.example.com/api/v4/projects/42/pipelines/9/cancel", "POST"],
      [
        "https://gitlab.example.com/api/v4/projects/42/pipelines/9/jobs?scope%5B%5D=failed&scope%5B%5D=success&include_retried=true",
        "GET",
      ],
    ]);
  });
});

describe("GitLab project releases", () => {
  it("lists, gets, creates, updates, and deletes releases by tag", async () => {
    const fetcher: typeof fetch = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).includes("/releases?")) return Response.json([{ tag_name: "v1.0.0", name: "Version 1" }]);
      return Response.json({ tag_name: "v1.0.0", name: "Version 1" });
    });
    const ctx = context(fetcher);

    await gitlabActionHandlers.list_project_releases!({ projectId: "42", page: 1, perPage: 10 }, ctx);
    await gitlabActionHandlers.get_project_release!({ projectId: "42", tagName: "v1.0.0" }, ctx);
    await gitlabActionHandlers.create_project_release!(
      {
        projectId: "42",
        tagName: "v1.0.0",
        name: "Version 1",
        description: "Notes",
        ref: "main",
        milestones: ["1.0"],
        releasedAt: "2026-08-08T12:00:00Z",
      },
      ctx,
    );
    await gitlabActionHandlers.update_project_release!(
      { projectId: "42", tagName: "v1.0.0", name: "Version 1.0", milestones: [] },
      ctx,
    );
    await gitlabActionHandlers.delete_project_release!({ projectId: "42", tagName: "v1.0.0" }, ctx);

    expect(vi.mocked(fetcher).mock.calls.map(([url, init]) => [String(url), init?.method ?? "GET"])).toEqual([
      ["https://gitlab.example.com/api/v4/projects/42/releases?page=1&per_page=10", "GET"],
      ["https://gitlab.example.com/api/v4/projects/42/releases/v1.0.0", "GET"],
      ["https://gitlab.example.com/api/v4/projects/42/releases", "POST"],
      ["https://gitlab.example.com/api/v4/projects/42/releases/v1.0.0", "PUT"],
      ["https://gitlab.example.com/api/v4/projects/42/releases/v1.0.0", "DELETE"],
    ]);
    expect(JSON.parse(String(vi.mocked(fetcher).mock.calls[2]![1]?.body))).toEqual({
      tag_name: "v1.0.0",
      name: "Version 1",
      description: "Notes",
      ref: "main",
      milestones: ["1.0"],
      released_at: "2026-08-08T12:00:00Z",
    });
    expect(JSON.parse(String(vi.mocked(fetcher).mock.calls[3]![1]?.body))).toEqual({
      name: "Version 1.0",
      milestones: [],
    });
  });
});
