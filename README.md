# StudyFlow 📚

A responsive student productivity dashboard built with HTML, CSS, and vanilla JavaScript. Track assignments, plan exams, and run focused study sessions in one place.

## Features

- **Task manager:** Add, complete, filter, and delete tasks; label each with a subject and priority.
- **Exam planner:** Add upcoming exams and see a live countdown in days.
- **Focus room:** 25-minute focus and 5-minute break presets, with start, pause, and reset controls.
- **Progress stats:** View completed tasks, task completion percentage, upcoming exams, and focus minutes.
- **Persistent data:** Tasks, exams, and study minutes are saved in browser `localStorage`.
- **Responsive design:** Works on desktop, tablet, and mobile.
- **Theme toggle:** Switch between dark and light modes.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Start adding tasks and exams.

No package installation or build step is needed.

## Publish with GitHub Pages

1. Create a GitHub repository named `studyflow`.
2. Upload `index.html`, `style.css`, `script.js`, and this `README.md` to the repository root.
3. Open **Settings → Pages** in the repository.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. Wait for GitHub Pages to publish the site. The published URL will appear in the Pages settings.

## Project structure

```text
studyflow/
├── index.html
├── style.css
├── script.js
└── README.md
```

## Tech stack

- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage`
- GitHub Pages

## Notes

- Data is stored locally in the browser you use. It does not automatically sync between devices or browsers.
- The timer counts a completed focus session toward the study-time total when it finishes. Resetting or leaving a running timer does not record a completed session.

## Future ideas

- Edit existing tasks and exams
- Subject-wise progress charts
- Weekly calendar view
- Export and import data
- Optional backend login and cloud sync

## License

This project is released under the MIT License. Add a `LICENSE` file if you want to distribute it formally under that license.
