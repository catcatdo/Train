const members = ["민지", "도윤", "서연", "준호"];

const schedules = [
  {
    member: "민지",
    title: "기타차고 올라가기",
    start: "09:10",
    end: "10:40",
    isMine: true,
  },
  {
    member: "민지",
    title: "기타차고 내려오기",
    start: "13:20",
    end: "14:30",
    isMine: false,
  },
  {
    member: "도윤",
    title: "기타차고 올라가기",
    start: "11:00",
    end: "12:45",
    isMine: false,
  },
  {
    member: "서연",
    title: "기타차고 내려오기",
    start: "15:00",
    end: "16:30",
    isMine: false,
  },
  {
    member: "준호",
    title: "기타차고 올라가기",
    start: "17:30",
    end: "19:10",
    isMine: false,
  },
];

const calendarGrid = document.getElementById("calendarGrid");
const scheduleForm = document.getElementById("scheduleForm");

const ticketIcon = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M5 7.5C5 6.12 6.12 5 7.5 5H20V9.2C18.9 9.46 18.08 10.45 18.08 11.6C18.08 12.75 18.9 13.74 20 14V19H7.5C6.12 19 5 17.88 5 16.5V15.2C6.1 14.94 6.92 13.95 6.92 12.8C6.92 11.65 6.1 10.66 5 10.4V7.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 8.5V15.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="2.5 2.5"/>
  </svg>
`;

const renderSchedules = () => {
  calendarGrid.innerHTML = "";

  members.forEach((member) => {
    const column = document.createElement("div");
    column.className = "member-column";

    const title = document.createElement("h3");
    title.textContent = member;
    column.appendChild(title);

    const memberSchedules = schedules.filter((schedule) => schedule.member === member);

    if (memberSchedules.length === 0) {
      const empty = document.createElement("p");
      empty.className = "schedule-title";
      empty.textContent = "아직 일정이 없습니다.";
      column.appendChild(empty);
    } else {
      memberSchedules.forEach((schedule) => {
        const card = document.createElement("div");
        card.className = `schedule-card${schedule.isMine ? " schedule-card--mine" : ""}`;

        const time = document.createElement("div");
        time.className = "schedule-time";
        time.innerHTML = `
          <span>${schedule.start} - ${schedule.end}</span>
          ${schedule.isMine ? `<span class="ticket">${ticketIcon} 기차표</span>` : ""}
        `;

        const titleEl = document.createElement("div");
        titleEl.className = "schedule-title";
        titleEl.textContent = schedule.title;

        card.appendChild(time);
        card.appendChild(titleEl);
        column.appendChild(card);
      });
    }

    calendarGrid.appendChild(column);
  });
};

scheduleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(scheduleForm);

  const newSchedule = {
    title: formData.get("title"),
    member: formData.get("member"),
    start: formData.get("start"),
    end: formData.get("end"),
    isMine: formData.get("isMine") === "on",
  };

  schedules.unshift(newSchedule);
  scheduleForm.reset();
  renderSchedules();
});

renderSchedules();
