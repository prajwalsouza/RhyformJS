export function tagPath(value) {
  if (typeof value !== "string" || !value.trim())
    throw Error("A tag needs a non-empty path");
  const path = value.trim().replace(/^\/+|\/+$/g, "");
  if (path.split("/").some((p) => !p.trim() || p === "." || p === ".."))
    throw Error("Use tag paths such as lesson/curves");
  return path;
}

export function createTagTree(objects) {
  const root = { name: "", path: "", children: [], count: objects.size },
    nodes = new Map([["", root]]),
    members = new Map([["", new Set(objects)]]);
  for (const object of objects)
    for (const tag of object.tags) {
      let path = "",
        parent = root;
      for (const name of tag.split("/")) {
        path = path ? path + "/" + name : name;
        if (!nodes.has(path)) {
          const node = { name, path, children: [], count: 0 };
          nodes.set(path, node);
          members.set(path, new Set());
          parent.children.push(node);
        }
        members.get(path).add(object);
        parent = nodes.get(path);
      }
    }
  for (const [path, node] of nodes) node.count = members.get(path).size;
  return root;
}

export function selectTag(objects, path) {
  path = tagPath(path);
  return [...objects].filter((o) =>
    [...o.tags].some((t) => t === path || t.startsWith(path + "/")),
  );
}
