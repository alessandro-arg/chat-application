import dayjs from "dayjs";

export const formatMessageMeta = (message, index, messages) => {
  const now = dayjs();
  const createdAtRaw = message.createdAt;

  const messageDate = dayjs(
    typeof createdAtRaw?.toDate === "function"
      ? createdAtRaw.toDate()
      : createdAtRaw
  );

  const formattedTime = messageDate.format("HH:mm");

  let formattedDate = "";
  if (now.isSame(messageDate, "day")) {
    formattedDate = "Today";
  } else if (now.subtract(1, "day").isSame(messageDate, "day")) {
    formattedDate = "Yesterday";
  } else if (now.diff(messageDate, "day") < 7) {
    formattedDate = messageDate.format("dddd");
  } else {
    formattedDate = messageDate.format("DD.MM.YY");
  }

  let showDateSeparator = true;
  if (index > 0) {
    const prevCreatedAt = messages[index - 1]?.createdAt;
    const prevDate = dayjs(
      typeof prevCreatedAt?.toDate === "function"
        ? prevCreatedAt.toDate()
        : prevCreatedAt
    );

    showDateSeparator = !prevDate.isSame(messageDate, "day");
  }

  return { formattedTime, formattedDate, showDateSeparator };
};
