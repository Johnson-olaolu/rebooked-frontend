import { IBook } from "@/services/types";
import { BookStatus, TimeQuery } from "./constants";

export const isValidToken = (token?: string): boolean => {
  if (!token) {
    return false;
  }
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < currentTime) {
      return false;
    }
    return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return false;
  }
};

export const getInitials = (name: string = "") => {
  let initials = "";
  const nameSplit = name.split(" ");

  if (nameSplit[0]) {
    initials += nameSplit[0].charAt(0).toUpperCase();
  }

  if (nameSplit[1]) {
    initials += nameSplit[1].charAt(0).toUpperCase();
  }

  return initials;
};

export const formatBookSoldQuery = (books: IBook[], timeQuery: TimeQuery) => {
  console.log(books);
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function getRangeFromQuery(query: TimeQuery): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (query) {
      case TimeQuery.LAST_WEEK:
        startDate.setDate(endDate.getDate() - 7);
        break;
      case TimeQuery.LAST_TWO_WEEKS:
        startDate.setDate(endDate.getDate() - 14);
        break;
      case TimeQuery.LAST_MONTH:
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case TimeQuery.LAST_SIX_MONTHS:
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case TimeQuery.LAST_YEAR:
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  function generateDateLabels(query: TimeQuery, startDate: Date, endDate: Date): string[] {
    const labels: string[] = [];
    const currentDate = new Date(startDate);

    if (query === TimeQuery.LAST_WEEK || query === TimeQuery.LAST_TWO_WEEKS) {
      while (currentDate <= endDate) {
        labels.push(`${daysOfWeek[currentDate.getDay()]} ${currentDate.getDate()}`);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else if (query === TimeQuery.LAST_MONTH || query === TimeQuery.LAST_SIX_MONTHS || query === TimeQuery.LAST_YEAR) {
      while (currentDate <= endDate) {
        const monthLabel = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        if (!labels.includes(monthLabel)) {
          labels.push(monthLabel);
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    } else {
      while (currentDate <= endDate) {
        labels.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return labels;
  }

  const { startDate, endDate } = getRangeFromQuery(timeQuery);
  const dateLabels = generateDateLabels(timeQuery, startDate, endDate);

  const summaryMap: { [key: string]: { numBooksSold: number; totalPrice: number } } = {};
  dateLabels.forEach((label) => {
    summaryMap[label] = { numBooksSold: 0, totalPrice: 0 };
  });

  books.forEach((b) => {
    if (b.status === BookStatus.SOLD && b.soldDate) {
      const soldDate = b.soldDate;
      const soldLabel =
        timeQuery === TimeQuery.LAST_WEEK || timeQuery === TimeQuery.LAST_TWO_WEEKS
          ? `${daysOfWeek[new Date(soldDate).getDay()]} ${new Date(soldDate).getDate()}`
          : timeQuery === TimeQuery.LAST_MONTH || timeQuery === TimeQuery.LAST_SIX_MONTHS || timeQuery === TimeQuery.LAST_YEAR
          ? `${months[new Date(soldDate).getMonth()]} ${new Date(soldDate).getFullYear()}`
          : new Date(soldDate).toISOString().split("T")[0];

      if (summaryMap[soldLabel]) {
        summaryMap[soldLabel].numBooksSold += 1;
        summaryMap[soldLabel].totalPrice += b.price;
      }
    }
  });

  return dateLabels.map((label) => ({
    name: label,
    numBooksSold: summaryMap[label].numBooksSold,
    totalPrice: summaryMap[label].totalPrice,
  }));
};
