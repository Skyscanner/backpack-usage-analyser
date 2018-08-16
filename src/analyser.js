/*
 * backpack-usage-analyser
 *
 * Copyright 2018-present Skyscanner Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const globby = require('globby');

const readFile = util.promisify(fs.readFile);

const config = require('./config');

const availablePlatforms = Object.keys(config);

module.exports = async (platform) => {
  if (!availablePlatforms.includes(platform)) {
    console.log();
    console.error(
      `😱  Unrecognised platform, please specify one of: ${availablePlatforms.join(
        ', ',
      )}`,
    );
    process.exit(1);
  }

  const { globs, patterns } = config[platform];

  const paths = await globby(globs, { gitignore: true });

  const usages = await Promise.all(
    paths.map(async (filePath) => {
      const fileContents = await readFile(path.resolve(filePath));

      return patterns.some(pattern => pattern.test(fileContents));
    }),
  );

  const numberOfUsages = usages.reduce(
    (count, isUsed) => (isUsed ? count + 1 : count),
    0,
  );
  const percentage = (100 / paths.length) * numberOfUsages;

  console.log();
  console.log(`Number of files analysed: ${paths.length}`);
  console.log(`Number of Backpack usages: ${numberOfUsages}`);
  console.log(`Usage (%): ${percentage.toFixed(2)}`);
};
