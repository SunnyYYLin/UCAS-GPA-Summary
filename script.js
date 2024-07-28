// ==UserScript==
// @name         UCAS-GPA-Summary
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Calculate the GPA for each course and summarize for each semester in UCAS SEP Platform.
// @author       SunnyYYLin
// @match        https://jwxk.ucas.ac.cn/score/bks/*
// @match        https://xkcts.ucas.ac.cn/score/bks/*
// @grant        none
// @license      AGPL License
// @downloadURL  https://update.greasyfork.org/scripts/471709/ImmediateGPA%20of%20UCAS.user.js
// @updateURL    https://update.greasyfork.org/scripts/471709/ImmediateGPA%20of%20UCAS.meta.js
// ==/UserScript==

(function () {
    'use strict';

    // Transform scores into grade points
    function calculateGradePoint(scoreText) {
        if (scoreText === '补考及格') {
            return 1.0;
        }

        const score = Number(scoreText);
        const gradePoints = [
            { min: 90, point: 4.0 },
            { min: 87, point: 3.9 },
            { min: 85, point: 3.8 },
            { min: 83, point: 3.7 },
            { min: 82, point: 3.6 },
            { min: 80, point: 3.5 },
            { min: 78, point: 3.4 },
            { min: 76, point: 3.3 },
            { min: 75, point: 3.2 },
            { min: 74, point: 3.1 },
            { min: 73, point: 3.0 },
            { min: 72, point: 2.9 },
            { min: 71, point: 2.8 },
            { min: 69, point: 2.7 },
            { min: 68, point: 2.6 },
            { min: 67, point: 2.5 },
            { min: 66, point: 2.4 },
            { min: 64, point: 2.3 },
            { min: 63, point: 2.2 },
            { min: 62, point: 2.1 },
            { min: 61, point: 1.8 },
            { min: 60, point: 1.6 }
        ];

        for (let i = 0; i < gradePoints.length; i++) {
            if (score >= gradePoints[i].min) {
                return gradePoints[i].point;
            }
        }

        return 0; // Default grade point for scores below 60
    }
    
    // Get elements of the table and transform it into an array 'grades'
    var gradesTable = document.querySelector(".table");
    var rowCount = gradesTable.rows.length;
    var grades = [];
    for (var i = 0; i < rowCount; i++) {
        var cellCount = gradesTable.rows[i].cells.length;
        var row = [];
        for (var j = 0; j < cellCount; j++) {
            var cell = gradesTable.rows[i].cells[j].innerHTML;
            row.push(cell);
        }
        grades.push(row);
    }

    // Initialize variables for total calculations
    var totalWeightedScore = 0;
    var totalCredit = 0;
    var totalGradePoint = 0;
    var totalCreditForGPA = 0;
    var semesters = [];
    var partialCredit = 0;
    var partialWeightedScore = 0;
    var partialGradePoint = 0;
    var partialCreditForGPA = 0;

    // Calculate GPA and average scores
    var prevSemester = "";
    for (var i = 1; i < grades.length; i++) {
        var credit = Number(grades[i][3]);
        if ((grades[i][6] !== prevSemester && i !== 1) || i === grades.length - 1) {
            partialCredit = totalCredit - partialCredit;
            partialCreditForGPA = totalCreditForGPA - partialCreditForGPA;
            partialWeightedScore = totalWeightedScore - partialWeightedScore;
            partialGradePoint = totalGradePoint - partialGradePoint;
            semesters.push(i);
            grades[semesters[semesters.length - 1]].credit = partialCredit;
            grades[semesters[semesters.length - 1]].scoreAverage = partialWeightedScore / partialCreditForGPA;
            grades[semesters[semesters.length - 1]].gradePointAverage = partialGradePoint / partialCreditForGPA;
        }
        prevSemester = grades[i][6];
        totalCredit += credit;
        if (grades[i][4] !== "合格") {
            var gradePoint = calculateGradePoint(grades[i][4]);
            var score = Number(grades[i][4]);
            var weightedScore = credit * score;
            var weightedGradePoint = credit * gradePoint;
            totalWeightedScore += weightedScore;
            totalGradePoint += weightedGradePoint;
            totalCreditForGPA += credit;
            console.log("gradePoint", gradePoint, i);
            gradesTable.rows[i].cells[5].innerHTML = gradePoint.toFixed(1);
        }
    }

    // Calculate overall averages
    var scoreAverage = totalWeightedScore / totalCreditForGPA;
    var gradePointAverage = totalGradePoint / totalCreditForGPA;
    console.log("scoreAverage", scoreAverage);
    console.log("gradePointAverage", gradePointAverage);
    scoreAverage = scoreAverage.toFixed(4);
    gradePointAverage = gradePointAverage.toFixed(4);

    // Output results
    var headers = ["", "Overall Summary", "Total Level", totalCredit, scoreAverage, `GPA: ${gradePointAverage}`, "", "", ""];
    var row = gradesTable.insertRow(0);
    for (var i = 0; i < headers.length; i++) {
        var cell = row.insertCell(i);
        cell.innerHTML = headers[i];
    }
    gradesTable.rows[1].cells[5].innerHTML = "Grade Point";

    for (var j = 0; j < semesters.length; j++) {
        var insertPosition = semesters[j] + j + 1;
        if (semesters[j] === grades.length - 1) {
            insertPosition++;
        }
        var row = gradesTable.insertRow(insertPosition);
        var cells = ["", "Semester Summary", "Semester Level", grades[semesters[j]].credit, grades[semesters[j]].scoreAverage.toFixed(4), `GPA: ${grades[semesters[j]].gradePointAverage.toFixed(4)}`, "", "", ""];
        for (var i = 0; i < cells.length; i++) {
            var cell = row.insertCell(i);
            cell.innerHTML = cells[i];
        }
    }

    console.log(semesters);
})();