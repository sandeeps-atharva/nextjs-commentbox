export const formatTime = (c) => {
  const time =
    c.updatedAt && c.updatedAt !== c.createdAt ? c.updatedAt : c.createdAt;
  return new Date(time).toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
};
