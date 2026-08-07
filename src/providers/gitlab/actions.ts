import type { ActionDefinition, JsonSchema } from "../../core/types.ts";

import { s } from "../../core/json-schema.ts";
import { defineProviderAction } from "../../core/provider-definition.ts";

const service = "gitlab";

interface GitlabActionSource {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
}

const pagination = {
  page: s.integer({ minimum: 1, description: "The page number to fetch." }),
  perPage: s.integer({ minimum: 1, maximum: 100, description: "The number of results per page." }),
};
const user = s.looseObject(
  {
    id: s.integer({ description: "The GitLab user ID." }),
    username: s.string({ description: "The GitLab username." }),
    name: s.string({ description: "The display name." }),
    state: s.string({ description: "The user state." }),
    avatar_url: s.nullableString("The avatar URL."),
    web_url: s.string({ description: "The GitLab profile URL." }),
    email: s.string({ description: "The email address when visible." }),
    public_email: s.string({ description: "The public email address when visible." }),
  },
  { description: "A GitLab user record." },
);
const namespace = s.looseObject(
  {
    id: s.integer({ description: "The namespace ID." }),
    name: s.string({ description: "The namespace name." }),
    path: s.string({ description: "The namespace path." }),
    kind: s.string({ description: "The namespace kind." }),
    full_path: s.string({ description: "The full namespace path." }),
  },
  { description: "A GitLab namespace record." },
);
const project = s.looseObject(
  {
    id: s.integer({ description: "The project ID." }),
    name: s.string({ description: "The project name." }),
    path: s.string({ description: "The project path." }),
    path_with_namespace: s.string({ description: "The project path including namespace." }),
    description: s.nullableString("The project description."),
    topics: s.array(s.string({ description: "A project topic." }), { description: "Topics assigned to the project." }),
    default_branch: s.nullableString("The default branch name."),
    visibility: s.string({ description: "The project visibility." }),
    web_url: s.string({ description: "The project URL." }),
    ssh_url_to_repo: s.string({ description: "The SSH clone URL." }),
    http_url_to_repo: s.string({ description: "The HTTPS clone URL." }),
    readme_url: s.nullableString("The README URL when returned by GitLab."),
    created_at: s.string({ description: "The project creation timestamp." }),
    last_activity_at: s.string({ description: "The last activity timestamp." }),
    archived: s.boolean({ description: "Whether the project is archived." }),
    star_count: s.integer({ description: "The number of stars." }),
    forks_count: s.integer({ description: "The number of forks." }),
    open_issues_count: s.integer({ description: "The number of open issues." }),
    namespace,
  },
  { description: "A GitLab project record." },
);
const milestone = s.looseObject(
  {
    id: s.integer({ description: "The milestone ID." }),
    iid: s.integer({ description: "The internal milestone ID within the project." }),
    title: s.string({ description: "The milestone title." }),
    description: s.nullableString("The milestone description."),
    state: s.string({ description: "The milestone state." }),
    due_date: s.nullableString("The milestone due date."),
    start_date: s.nullableString("The milestone start date."),
    web_url: s.string({ description: "The milestone URL." }),
  },
  { description: "A GitLab milestone record." },
);
const issue = s.looseObject(
  {
    id: s.integer({ description: "The issue ID." }),
    iid: s.integer({ description: "The internal issue ID within the project." }),
    project_id: s.integer({ description: "The project ID." }),
    title: s.string({ description: "The issue title." }),
    description: s.nullableString("The issue description."),
    state: s.string({ description: "The issue state." }),
    web_url: s.string({ description: "The issue URL." }),
    confidential: s.boolean({ description: "Whether the issue is confidential." }),
    discussion_locked: s.nullable(s.boolean({ description: "Whether discussions are locked." })),
    issue_type: s.string({ description: "The GitLab issue type." }),
    author: user,
    assignees: s.array(user, { description: "Users assigned to the issue." }),
    labels: s.array(s.string({ description: "A label name." }), { description: "Labels attached to the issue." }),
    milestone: s.nullable(milestone),
    created_at: s.string({ description: "The issue creation timestamp." }),
    updated_at: s.string({ description: "The issue update timestamp." }),
    closed_at: s.nullableString("The timestamp when the issue was closed."),
    due_date: s.nullableString("The issue due date."),
    user_notes_count: s.integer({ description: "The number of notes on the issue." }),
  },
  { description: "A GitLab issue record." },
);
const paginatedProjects = s.object(
  {
    projects: s.array(project, { description: "Projects returned by GitLab." }),
    total: s.nullable(s.integer({ description: "The total number of projects when GitLab returns it." })),
    nextPage: s.nullable(s.integer({ description: "The next page number when another page exists." })),
  },
  { required: ["projects", "total", "nextPage"], description: "A paginated GitLab projects response." },
);
const paginatedIssues = s.object(
  {
    issues: s.array(issue, { description: "Issues returned by GitLab." }),
    total: s.nullable(s.integer({ description: "The total number of issues when GitLab returns it." })),
    nextPage: s.nullable(s.integer({ description: "The next page number when another page exists." })),
  },
  { required: ["issues", "total", "nextPage"], description: "A paginated GitLab issues response." },
);
const label = s.looseObject(
  {
    id: s.integer({ description: "The label ID." }),
    name: s.string({ description: "The label name." }),
    color: s.string({ description: "The label color." }),
    text_color: s.string({ description: "The label text color." }),
    description: s.nullableString("The label description."),
    open_issues_count: s.integer({ description: "The number of open issues with the label." }),
    closed_issues_count: s.integer({ description: "The number of closed issues with the label." }),
  },
  { description: "A GitLab project label." },
);
const pipeline = s.looseObject(
  {
    id: s.integer({ description: "The pipeline ID." }),
    iid: s.integer({ description: "The internal pipeline ID within the project." }),
    project_id: s.integer({ description: "The project ID." }),
    status: s.string({ description: "The pipeline status." }),
    source: s.string({ description: "The pipeline source." }),
    ref: s.nullableString("The branch or tag reference."),
    sha: s.string({ description: "The commit SHA." }),
    web_url: s.string({ description: "The pipeline URL." }),
    created_at: s.string({ description: "The pipeline creation timestamp." }),
    updated_at: s.string({ description: "The pipeline update timestamp." }),
  },
  { description: "A GitLab pipeline." },
);
const job = s.looseObject(
  {
    id: s.integer({ description: "The job ID." }),
    name: s.string({ description: "The job name." }),
    stage: s.string({ description: "The pipeline stage." }),
    status: s.string({ description: "The job status." }),
    ref: s.nullableString("The branch or tag reference."),
    web_url: s.nullableString("The job URL."),
    created_at: s.string({ description: "The job creation timestamp." }),
    started_at: s.nullableString("The job start timestamp."),
    finished_at: s.nullableString("The job completion timestamp."),
    duration: s.nullableNumber("The job duration in seconds."),
  },
  { description: "A GitLab pipeline job." },
);
const release = s.looseObject(
  {
    tag_name: s.string({ description: "The release tag name." }),
    name: s.nullableString("The release name."),
    description: s.nullableString("The release notes."),
    created_at: s.string({ description: "The release creation timestamp." }),
    released_at: s.string({ description: "The release timestamp." }),
    upcoming_release: s.boolean({ description: "Whether the release date is in the future." }),
    tag_path: s.string({ description: "The project-relative tag path." }),
  },
  { description: "A GitLab release." },
);
const paginatedLabels = paginated("labels", label, "project labels");
const paginatedPipelines = paginated("pipelines", pipeline, "pipelines");
const paginatedJobs = paginated("jobs", job, "pipeline jobs");
const paginatedReleases = paginated("releases", release, "releases");
const success = s.object(
  { success: s.boolean({ description: "Whether the operation completed successfully." }) },
  { required: ["success"], description: "A successful GitLab operation." },
);
const projectId = s.string({
  minLength: 1,
  description: "The GitLab project ID or URL-encoded path with namespace, such as 123 or group%2Fproject.",
});

function input(properties: Record<string, JsonSchema>, required: string[] = []): JsonSchema {
  return s.actionInput(properties, required, "GitLab action input.");
}

function paginated(field: string, item: JsonSchema, description: string): JsonSchema {
  return s.object(
    {
      [field]: s.array(item, { description: `GitLab ${description} returned by the request.` }),
      total: s.nullable(s.integer({ description: `The total number of ${description} when GitLab returns it.` })),
      nextPage: s.nullable(s.integer({ description: "The next page number when another page exists." })),
    },
    { required: [field, "total", "nextPage"], description: `A paginated GitLab ${description} response.` },
  );
}

const actions: GitlabActionSource[] = [
  {
    name: "get_current_user",
    description: "Get the current authenticated GitLab user profile.",
    inputSchema: input({}),
    outputSchema: user,
  },
  {
    name: "list_projects",
    description:
      "List GitLab projects visible to the authenticated personal access token, with optional search and membership filters.",
    inputSchema: input({
      search: s.string({ minLength: 1, description: "Search projects by name or path." }),
      membership: s.boolean({ description: "Limit results to projects the authenticated user is a member of." }),
      owned: s.boolean({ description: "Limit results to projects explicitly owned by the authenticated user." }),
      simple: s.boolean({ description: "Return a simplified project representation from GitLab." }),
      orderBy: s.stringEnum(["id", "name", "path", "created_at", "updated_at", "last_activity_at"], {
        description: "Sort projects by a GitLab-supported field.",
      }),
      sort: s.stringEnum(["asc", "desc"], { description: "Sort direction." }),
      ...pagination,
    }),
    outputSchema: paginatedProjects,
  },
  {
    name: "get_project",
    description: "Get a GitLab project by numeric ID or URL-encoded path with namespace.",
    inputSchema: input({ projectId }, ["projectId"]),
    outputSchema: project,
  },
  {
    name: "update_project",
    description: "Update long-term GitLab project metadata such as description, topics, or visibility.",
    inputSchema: input(
      {
        projectId,
        description: s.string({ description: "The new project description. Use an empty string to clear it." }),
        topics: s.array(s.string({ minLength: 1, description: "A project topic." }), {
          description: "The complete replacement list of project topics. Use an empty array to clear topics.",
        }),
        visibility: s.stringEnum(["private", "internal", "public"], {
          description: "The new project visibility.",
        }),
      },
      ["projectId"],
    ),
    outputSchema: project,
  },
  {
    name: "list_project_labels",
    description: "List labels configured for a GitLab project.",
    inputSchema: input(
      { projectId, search: s.string({ minLength: 1, description: "Search labels by name." }), ...pagination },
      ["projectId"],
    ),
    outputSchema: paginatedLabels,
  },
  {
    name: "create_project_label",
    description: "Create a label in a GitLab project.",
    inputSchema: input(
      {
        projectId,
        name: s.string({ minLength: 1, description: "The label name." }),
        color: s.string({ minLength: 1, description: "The label color, such as #FF0000 or a CSS color name." }),
        description: s.string({ description: "The label description." }),
      },
      ["projectId", "name", "color"],
    ),
    outputSchema: label,
  },
  {
    name: "update_project_label",
    description: "Update a GitLab project label identified by numeric ID or URL-encoded name.",
    inputSchema: input(
      {
        projectId,
        labelId: s.string({ minLength: 1, description: "The label ID or URL-encoded label name." }),
        newName: s.string({ minLength: 1, description: "The new label name." }),
        color: s.string({ minLength: 1, description: "The new label color." }),
        description: s.string({ description: "The new label description. Use an empty string to clear it." }),
      },
      ["projectId", "labelId"],
    ),
    outputSchema: label,
  },
  {
    name: "delete_project_label",
    description: "Delete a GitLab project label identified by numeric ID or URL-encoded name.",
    inputSchema: input(
      { projectId, labelId: s.string({ minLength: 1, description: "The label ID or URL-encoded label name." }) },
      ["projectId", "labelId"],
    ),
    outputSchema: success,
  },
  {
    name: "list_project_pipelines",
    description: "List pipelines for a GitLab project with common status, source, ref, and SHA filters.",
    inputSchema: input(
      {
        projectId,
        status: s.stringEnum(
          [
            "created",
            "waiting_for_resource",
            "preparing",
            "pending",
            "running",
            "success",
            "failed",
            "canceled",
            "skipped",
            "manual",
            "scheduled",
          ],
          { description: "Filter by pipeline status." },
        ),
        source: s.string({ minLength: 1, description: "Filter by pipeline source." }),
        ref: s.string({ minLength: 1, description: "Filter by branch or tag reference." }),
        sha: s.string({ minLength: 1, description: "Filter by commit SHA." }),
        username: s.string({ minLength: 1, description: "Filter by the user who triggered the pipeline." }),
        updatedAfter: s.string({
          minLength: 1,
          description: "Return pipelines updated after this ISO 8601 timestamp.",
        }),
        updatedBefore: s.string({
          minLength: 1,
          description: "Return pipelines updated before this ISO 8601 timestamp.",
        }),
        orderBy: s.stringEnum(["id", "status", "ref", "updated_at", "user_id"], { description: "Sort field." }),
        sort: s.stringEnum(["asc", "desc"], { description: "Sort direction." }),
        ...pagination,
      },
      ["projectId"],
    ),
    outputSchema: paginatedPipelines,
  },
  {
    name: "get_project_pipeline",
    description: "Get one pipeline in a GitLab project.",
    inputSchema: input({ projectId, pipelineId: s.integer({ minimum: 1, description: "The pipeline ID." }) }, [
      "projectId",
      "pipelineId",
    ]),
    outputSchema: pipeline,
  },
  {
    name: "retry_project_pipeline",
    description: "Retry failed or canceled jobs in a GitLab project pipeline.",
    inputSchema: input({ projectId, pipelineId: s.integer({ minimum: 1, description: "The pipeline ID." }) }, [
      "projectId",
      "pipelineId",
    ]),
    outputSchema: pipeline,
  },
  {
    name: "cancel_project_pipeline",
    description: "Cancel a running or pending GitLab project pipeline.",
    inputSchema: input({ projectId, pipelineId: s.integer({ minimum: 1, description: "The pipeline ID." }) }, [
      "projectId",
      "pipelineId",
    ]),
    outputSchema: pipeline,
  },
  {
    name: "list_project_pipeline_jobs",
    description: "List jobs in a GitLab project pipeline.",
    inputSchema: input(
      {
        projectId,
        pipelineId: s.integer({ minimum: 1, description: "The pipeline ID." }),
        scope: s.array(s.string({ minLength: 1, description: "A GitLab job status." }), {
          description: "Filter by one or more job statuses.",
        }),
        includeRetried: s.boolean({ description: "Include retried jobs in the response." }),
        ...pagination,
      },
      ["projectId", "pipelineId"],
    ),
    outputSchema: paginatedJobs,
  },
  {
    name: "list_project_releases",
    description: "List releases for a GitLab project.",
    inputSchema: input({ projectId, ...pagination }, ["projectId"]),
    outputSchema: paginatedReleases,
  },
  {
    name: "get_project_release",
    description: "Get a GitLab project release by tag name.",
    inputSchema: input({ projectId, tagName: s.string({ minLength: 1, description: "The release tag name." }) }, [
      "projectId",
      "tagName",
    ]),
    outputSchema: release,
  },
  {
    name: "create_project_release",
    description: "Create a release for a GitLab project.",
    inputSchema: input(
      {
        projectId,
        tagName: s.string({ minLength: 1, description: "The release tag name." }),
        name: s.string({ description: "The release name." }),
        description: s.string({ description: "The release notes." }),
        ref: s.string({ minLength: 1, description: "A commit SHA, branch, or tag used to create a missing tag." }),
        milestones: s.array(s.string({ minLength: 1, description: "A milestone title." }), {
          description: "Milestone titles associated with the release.",
        }),
        releasedAt: s.string({ minLength: 1, description: "The release timestamp in ISO 8601 format." }),
      },
      ["projectId", "tagName"],
    ),
    outputSchema: release,
  },
  {
    name: "update_project_release",
    description: "Update a GitLab project release by tag name.",
    inputSchema: input(
      {
        projectId,
        tagName: s.string({ minLength: 1, description: "The existing release tag name." }),
        name: s.string({ description: "The new release name." }),
        description: s.string({ description: "The new release notes." }),
        milestones: s.array(s.string({ minLength: 1, description: "A milestone title." }), {
          description: "The complete replacement list of milestone titles. Use an empty array to clear milestones.",
        }),
        releasedAt: s.string({ minLength: 1, description: "The new release timestamp in ISO 8601 format." }),
      },
      ["projectId", "tagName"],
    ),
    outputSchema: release,
  },
  {
    name: "delete_project_release",
    description: "Delete a GitLab project release without deleting its Git tag.",
    inputSchema: input({ projectId, tagName: s.string({ minLength: 1, description: "The release tag name." }) }, [
      "projectId",
      "tagName",
    ]),
    outputSchema: success,
  },
  {
    name: "list_project_issues",
    description: "List issues for a GitLab project with common state, label, assignee, and search filters.",
    inputSchema: input(
      {
        projectId,
        state: s.stringEnum(["opened", "closed", "all"], { description: "Issue state filter." }),
        labels: s.string({ minLength: 1, description: "Comma-separated label names to filter issues by." }),
        assigneeId: s.integer({ description: "Filter by assignee user ID." }),
        search: s.string({ minLength: 1, description: "Search issues by title or description." }),
        orderBy: s.stringEnum(
          [
            "created_at",
            "updated_at",
            "priority",
            "due_date",
            "relative_position",
            "label_priority",
            "milestone_due",
            "popularity",
            "weight",
          ],
          { description: "Sort issues by a GitLab-supported field." },
        ),
        sort: s.stringEnum(["asc", "desc"], { description: "Sort direction." }),
        ...pagination,
      },
      ["projectId"],
    ),
    outputSchema: paginatedIssues,
  },
  {
    name: "create_project_issue",
    description: "Create a new issue in a GitLab project.",
    inputSchema: input(
      {
        projectId,
        title: s.string({ minLength: 1, description: "The issue title." }),
        description: s.string({ minLength: 1, description: "The issue description." }),
        labels: s.string({ minLength: 1, description: "Comma-separated label names to attach to the issue." }),
        assigneeIds: s.array(s.integer({ description: "A GitLab user ID." }), {
          description: "User IDs to assign to the issue.",
        }),
        confidential: s.boolean({ description: "Whether the issue should be confidential." }),
        dueDate: s.string({ minLength: 1, description: "The issue due date in YYYY-MM-DD format." }),
      },
      ["projectId", "title"],
    ),
    outputSchema: issue,
  },
];

export const gitlabActions: ActionDefinition[] = actions.map((action) =>
  defineProviderAction(service, {
    ...action,
    requiredScopes: [],
    providerPermissions: [],
  }),
);
