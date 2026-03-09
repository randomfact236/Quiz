"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var csv_importer_1 = require("./src/app/admin/utils/csv-importer");
var content = fs_1.default.readFileSync('../../issue and improvement/animals_questions_fixed_v2.csv', 'utf-8');
var result = (0, csv_importer_1.parseCSVContent)(content);
console.log(JSON.stringify(result, null, 2));
