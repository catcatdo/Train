(function () {
  'use strict';

  // ============ CONSTANTS ============
  const STORAGE_KEY = 'trainCalendarData';
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const TICKET_PERSON_ID = 3; // 이 사람(주황)만 기차표 아이콘 자동 표시
  const DEFAULT_PEOPLE = [
    { id: 0, name: '사람 1', color: '#4A90D9' },
    { id: 1, name: '사람 2', color: '#E85D75' },
    { id: 2, name: '사람 3', color: '#2ECC71' },
    { id: 3, name: '기차표', color: '#F39C12' },
  ];
  const MAX_PILLS_VISIBLE = 3;

  // ============ STATE ============
  const state = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    schedules: [],
    people: JSON.parse(JSON.stringify(DEFAULT_PEOPLE)),
    editingScheduleId: null,
    selectedDate: null,
  };

  // ============ DOM REFERENCES ============
  const dom = {
    calendarGrid: document.getElementById('calendar-grid'),
    currentMonth: document.getElementById('current-month'),
    prevMonth: document.getElementById('prev-month'),
    nextMonth: document.getElementById('next-month'),
    btnToday: document.getElementById('btn-today'),
    personLegend: document.getElementById('person-legend'),
    btnEditNames: document.getElementById('btn-edit-names'),
    // Schedule modal
    scheduleModal: document.getElementById('schedule-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDate: document.getElementById('modal-date'),
    scheduleForm: document.getElementById('schedule-form'),
    personSelector: document.getElementById('person-selector'),
    startTime: document.getElementById('start-time'),
    endTime: document.getElementById('end-time'),
    description: document.getElementById('description'),
    btnDelete: document.getElementById('btn-delete'),
    btnModalClose: document.getElementById('btn-modal-close'),
    btnCancel: document.getElementById('btn-cancel'),
    // Person modal
    personModal: document.getElementById('person-modal'),
    personForm: document.getElementById('person-form'),
    personNameInputs: document.getElementById('person-name-inputs'),
    btnPersonModalClose: document.getElementById('btn-person-modal-close'),
    btnPersonCancel: document.getElementById('btn-person-cancel'),
    // Day modal
    dayModal: document.getElementById('day-modal'),
    dayModalTitle: document.getElementById('day-modal-title'),
    dayScheduleList: document.getElementById('day-schedule-list'),
    btnDayModalClose: document.getElementById('btn-day-modal-close'),
    btnDayAdd: document.getElementById('btn-day-add'),
  };

  // ============ STORAGE ============
  const Storage = {
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    save() {
      const data = {
        schedules: state.schedules,
        people: state.people,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
  };

  // ============ UTILS ============
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 7);
  }

  function formatDateISO(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  function formatDateKorean(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = WEEKDAYS[d.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  }

  function formatTime(timeStr) {
    return timeStr; // HH:MM format is fine
  }

  // ============ CALENDAR RENDERING ============
  const Calendar = {
    render() {
      const { currentYear, currentMonth } = state;
      dom.currentMonth.textContent = `${currentYear}년 ${currentMonth + 1}월`;

      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

      const today = new Date();
      const todayStr = formatDateISO(today.getFullYear(), today.getMonth(), today.getDate());

      dom.calendarGrid.innerHTML = '';

      const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

      for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';

        let year, month, day;
        const dayCol = i % 7;

        if (i < firstDay) {
          // Previous month
          day = daysInPrevMonth - firstDay + i + 1;
          month = currentMonth - 1;
          year = currentYear;
          if (month < 0) { month = 11; year--; }
          cell.classList.add('other-month');
        } else if (i - firstDay >= daysInMonth) {
          // Next month
          day = i - firstDay - daysInMonth + 1;
          month = currentMonth + 1;
          year = currentYear;
          if (month > 11) { month = 0; year++; }
          cell.classList.add('other-month');
        } else {
          // Current month
          day = i - firstDay + 1;
          month = currentMonth;
          year = currentYear;
        }

        const dateStr = formatDateISO(year, month, day);
        cell.dataset.date = dateStr;

        if (dayCol === 0) cell.classList.add('sunday');
        if (dayCol === 6) cell.classList.add('saturday');
        if (dateStr === todayStr) cell.classList.add('today');

        // Date number
        const dateNum = document.createElement('span');
        dateNum.className = 'date-number';
        dateNum.textContent = day;
        cell.appendChild(dateNum);

        // Schedule pills
        const scheduleContainer = document.createElement('div');
        scheduleContainer.className = 'schedule-list';
        this.renderSchedules(scheduleContainer, dateStr);
        cell.appendChild(scheduleContainer);

        // Click handler
        cell.addEventListener('click', (e) => {
          if (e.target.closest('.schedule-pill') || e.target.closest('.pill-more')) return;
          Modal.openForAdd(dateStr);
        });

        dom.calendarGrid.appendChild(cell);
      }
    },

    renderSchedules(container, dateStr) {
      const schedules = state.schedules
        .filter((s) => s.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      if (schedules.length === 0) return;

      const visible = schedules.length > MAX_PILLS_VISIBLE
        ? schedules.slice(0, MAX_PILLS_VISIBLE - 1)
        : schedules;

      visible.forEach((schedule) => {
        container.appendChild(this.createPill(schedule));
      });

      if (schedules.length > MAX_PILLS_VISIBLE) {
        const remaining = schedules.length - (MAX_PILLS_VISIBLE - 1);
        const more = document.createElement('div');
        more.className = 'pill-more';
        more.textContent = `+${remaining}개 더보기`;
        more.addEventListener('click', (e) => {
          e.stopPropagation();
          DayModal.open(dateStr);
        });
        container.appendChild(more);
      }
    },

    createPill(schedule) {
      const pill = document.createElement('div');
      pill.className = `schedule-pill person-${schedule.personId}`;
      pill.dataset.scheduleId = schedule.id;

      let html = '';
      // 기차표(주황) 사람만 자동으로 🎫 아이콘 표시
      if (schedule.personId === TICKET_PERSON_ID) {
        html += '<span class="pill-ticket">🎫</span>';
      }
      const person = state.people[schedule.personId];
      html += `<span class="pill-name">${person.name}</span>`;
      html += `<span class="pill-time">${formatTime(schedule.startTime)}~${formatTime(schedule.endTime)}</span>`;
      if (schedule.description) {
        html += `<span class="pill-memo">${schedule.description}</span>`;
      }

      pill.innerHTML = html;
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        Modal.openForEdit(schedule.id);
      });

      return pill;
    },
  };

  // ============ PERSON LEGEND ============
  function renderPersonLegend() {
    dom.personLegend.innerHTML = '';
    state.people.forEach((person) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<span class="legend-dot" style="background:${person.color}"></span>${person.name}`;
      item.addEventListener('click', () => PersonModal.open());
      dom.personLegend.appendChild(item);
    });
  }

  // ============ PERSON SELECTOR (in modal) ============
  function renderPersonSelector() {
    dom.personSelector.innerHTML = '';
    state.people.forEach((person, index) => {
      const chip = document.createElement('label');
      chip.className = 'person-chip';
      chip.style.color = person.color;
      chip.innerHTML = `
        <input type="radio" name="person" value="${index}">
        <span class="chip-dot" style="background:${person.color}"></span>
        <span class="chip-name">${person.name}</span>
      `;
      const radio = chip.querySelector('input');
      radio.addEventListener('change', () => {
        dom.personSelector.querySelectorAll('.person-chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
      dom.personSelector.appendChild(chip);
    });
  }

  // ============ SCHEDULE MODAL ============
  const Modal = {
    openForAdd(dateStr) {
      state.editingScheduleId = null;
      state.selectedDate = dateStr;
      dom.modalTitle.textContent = '일정 추가';
      dom.modalDate.textContent = formatDateKorean(dateStr);
      dom.scheduleForm.reset();
      dom.btnDelete.classList.add('hidden');

      renderPersonSelector();

      // Select first person by default
      const firstRadio = dom.personSelector.querySelector('input[type="radio"]');
      if (firstRadio) {
        firstRadio.checked = true;
        firstRadio.closest('.person-chip').classList.add('selected');
      }

      dom.scheduleModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    },

    openForEdit(scheduleId) {
      const schedule = state.schedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      state.editingScheduleId = scheduleId;
      state.selectedDate = schedule.date;
      dom.modalTitle.textContent = '일정 수정';
      dom.modalDate.textContent = formatDateKorean(schedule.date);
      dom.btnDelete.classList.remove('hidden');

      renderPersonSelector();

      // Fill form
      const radio = dom.personSelector.querySelector(`input[value="${schedule.personId}"]`);
      if (radio) {
        radio.checked = true;
        radio.closest('.person-chip').classList.add('selected');
      }
      dom.startTime.value = schedule.startTime;
      dom.endTime.value = schedule.endTime;
      dom.description.value = schedule.description || '';

      dom.scheduleModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    },

    close() {
      dom.scheduleModal.classList.add('hidden');
      document.body.style.overflow = '';
      state.editingScheduleId = null;
    },
  };

  // ============ SCHEDULE CRUD ============
  const ScheduleManager = {
    add(data) {
      const schedule = {
        id: generateId(),
        personId: data.personId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        hasTicket: data.hasTicket,
        description: data.description || '',
      };
      state.schedules.push(schedule);
      Storage.save();
      Calendar.render();
    },

    update(id, data) {
      const index = state.schedules.findIndex((s) => s.id === id);
      if (index === -1) return;
      state.schedules[index] = { ...state.schedules[index], ...data };
      Storage.save();
      Calendar.render();
    },

    remove(id) {
      state.schedules = state.schedules.filter((s) => s.id !== id);
      Storage.save();
      Calendar.render();
    },
  };

  // ============ PERSON NAME MODAL ============
  const PersonModal = {
    open() {
      dom.personNameInputs.innerHTML = '';
      state.people.forEach((person) => {
        const row = document.createElement('div');
        row.className = 'person-name-row';
        row.innerHTML = `
          <span class="person-name-dot" style="background:${person.color}"></span>
          <input type="text" class="form-input" value="${person.name}" data-person-id="${person.id}" maxlength="10">
        `;
        dom.personNameInputs.appendChild(row);
      });
      dom.personModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    },

    close() {
      dom.personModal.classList.add('hidden');
      document.body.style.overflow = '';
    },

    save() {
      const inputs = dom.personNameInputs.querySelectorAll('input');
      inputs.forEach((input) => {
        const id = parseInt(input.dataset.personId, 10);
        const name = input.value.trim() || `사람 ${id + 1}`;
        state.people[id].name = name;
      });
      Storage.save();
      renderPersonLegend();
      Calendar.render();
      this.close();
    },
  };

  // ============ DAY DETAIL MODAL ============
  const DayModal = {
    currentDate: null,

    open(dateStr) {
      this.currentDate = dateStr;
      dom.dayModalTitle.textContent = formatDateKorean(dateStr);

      const schedules = state.schedules
        .filter((s) => s.date === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      dom.dayScheduleList.innerHTML = '';

      if (schedules.length === 0) {
        dom.dayScheduleList.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:20px;">일정이 없습니다.</div>';
      } else {
        schedules.forEach((schedule) => {
          const person = state.people[schedule.personId];
          const item = document.createElement('div');
          item.className = 'day-schedule-item';
          item.innerHTML = `
            <span class="day-item-dot" style="background:${person.color}"></span>
            <div class="day-item-info">
              <div class="day-item-name">${person.name}</div>
              <div class="day-item-time">${formatTime(schedule.startTime)} ~ ${formatTime(schedule.endTime)}${schedule.description ? ' · ' + schedule.description : ''}</div>
            </div>
            ${schedule.personId === TICKET_PERSON_ID ? '<span class="day-item-ticket">🎫</span>' : ''}
          `;
          item.addEventListener('click', () => {
            this.close();
            Modal.openForEdit(schedule.id);
          });
          dom.dayScheduleList.appendChild(item);
        });
      }

      dom.dayModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    },

    close() {
      dom.dayModal.classList.add('hidden');
      document.body.style.overflow = '';
    },
  };

  // ============ EVENT BINDINGS ============
  function bindEvents() {
    // Navigation
    dom.prevMonth.addEventListener('click', () => {
      state.currentMonth--;
      if (state.currentMonth < 0) {
        state.currentMonth = 11;
        state.currentYear--;
      }
      Calendar.render();
    });

    dom.nextMonth.addEventListener('click', () => {
      state.currentMonth++;
      if (state.currentMonth > 11) {
        state.currentMonth = 0;
        state.currentYear++;
      }
      Calendar.render();
    });

    dom.btnToday.addEventListener('click', () => {
      const today = new Date();
      state.currentYear = today.getFullYear();
      state.currentMonth = today.getMonth();
      Calendar.render();
    });

    // Schedule form submit
    dom.scheduleForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const selectedPerson = dom.personSelector.querySelector('input[name="person"]:checked');
      if (!selectedPerson) {
        alert('사람을 선택해주세요.');
        return;
      }

      const personId = parseInt(selectedPerson.value, 10);
      const formData = {
        personId: personId,
        date: state.selectedDate,
        startTime: dom.startTime.value,
        endTime: dom.endTime.value,
        hasTicket: personId === TICKET_PERSON_ID,
        description: dom.description.value.trim(),
      };

      if (!formData.startTime || !formData.endTime) {
        alert('승차 시간과 하차 시간을 입력해주세요.');
        return;
      }

      if (formData.startTime >= formData.endTime) {
        alert('하차 시간은 승차 시간 이후여야 합니다.');
        return;
      }

      if (state.editingScheduleId) {
        ScheduleManager.update(state.editingScheduleId, formData);
      } else {
        ScheduleManager.add(formData);
      }

      Modal.close();
    });

    // Delete button
    dom.btnDelete.addEventListener('click', () => {
      if (!state.editingScheduleId) return;
      if (confirm('이 일정을 삭제하시겠습니까?')) {
        ScheduleManager.remove(state.editingScheduleId);
        Modal.close();
      }
    });

    // Close schedule modal
    dom.btnModalClose.addEventListener('click', () => Modal.close());
    dom.btnCancel.addEventListener('click', () => Modal.close());
    dom.scheduleModal.addEventListener('click', (e) => {
      if (e.target === dom.scheduleModal) Modal.close();
    });

    // Person name modal
    dom.btnEditNames.addEventListener('click', () => PersonModal.open());
    dom.btnPersonModalClose.addEventListener('click', () => PersonModal.close());
    dom.btnPersonCancel.addEventListener('click', () => PersonModal.close());
    dom.personModal.addEventListener('click', (e) => {
      if (e.target === dom.personModal) PersonModal.close();
    });
    dom.personForm.addEventListener('submit', (e) => {
      e.preventDefault();
      PersonModal.save();
    });

    // Day detail modal
    dom.btnDayModalClose.addEventListener('click', () => DayModal.close());
    dom.dayModal.addEventListener('click', (e) => {
      if (e.target === dom.dayModal) DayModal.close();
    });
    dom.btnDayAdd.addEventListener('click', () => {
      DayModal.close();
      if (DayModal.currentDate) {
        Modal.openForAdd(DayModal.currentDate);
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!dom.scheduleModal.classList.contains('hidden')) {
          Modal.close();
        } else if (!dom.personModal.classList.contains('hidden')) {
          PersonModal.close();
        } else if (!dom.dayModal.classList.contains('hidden')) {
          DayModal.close();
        }
      }
    });
  }

  // ============ INIT ============
  function init() {
    const saved = Storage.load();
    if (saved) {
      state.schedules = saved.schedules || [];
      if (saved.people && saved.people.length === 4) {
        state.people = saved.people;
      }
    }

    renderPersonLegend();
    Calendar.render();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
