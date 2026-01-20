const monthsFull = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const monthsShort = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function formatDate(date: string, shortMonth = false) {
  const [year, month, day] = date.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = shortMonth
    ? monthsShort[monthIndex]
    : monthsFull[monthIndex];
  const dayNum = parseInt(day, 10);
  return `${monthName} ${dayNum}, ${year}`;
}

export function formatSimpleDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${parseInt(month)}/${day}/${year}`;
}

function format(d: Date) {
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });
}

export function getCurrentYear() {
  const date = format(new Date());
  return date.split(",")[1];
}
