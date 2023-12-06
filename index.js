import fs from "fs";
import csvParser from "csv-parser";

const MIN_BALLOTS_NEEDED = 17;
const MAX_FUNDING_REPORTED = 5000000; // 5 million USD

const readFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    let data = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        if (
          parseInt(row.included_in_ballots, 10) >= MIN_BALLOTS_NEEDED &&
          parseInt(row.funding_reported_usd, 10) < MAX_FUNDING_REPORTED
        ) {
          data.push(row);
        }
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (error) => reject(error));
  });
};

const calculatePercentages = (data) => {
  const totalIncludedInBallots = data.reduce(
    (sum, row) => sum + parseInt(row.included_in_ballots, 10),
    0
  );
  let calculatedPercentages = data.map((row) => ({
    address: row.applicant_address,
    percentage:
      (parseInt(row.included_in_ballots, 10) / totalIncludedInBallots) * 100,
    projectName: row.project_name,
  }));

  // Adjust the last percentage to make sure the total is exactly 100%
  let totalPercentage = calculatedPercentages.reduce(
    (sum, row) => sum + parseFloat(row.percentage.toFixed(2)),
    0
  );
  let adjustment = 100 - totalPercentage;
  calculatedPercentages[calculatedPercentages.length - 1].percentage +=
    adjustment;

  return calculatedPercentages.map((row) => ({
    address: row.address,
    percentage: parseFloat(row.percentage.toFixed(2)),
    projectName: row.projectName,
  }));
};

const outputFormattedData = (data) => {
  let totalPercentage = 0;
  data.forEach((row) => {
    console.log(`${row.address}, ${row.percentage}`); /*%, ${row.projectName}*/
    totalPercentage += parseFloat(row.percentage);
  });
  return totalPercentage;
};

const processFile = async (filePath) => {
  try {
    const data = await readFile(filePath);
    const percentages = calculatePercentages(data);
    const totalPercentage = outputFormattedData(percentages);
    console.log("Total percentage: ", totalPercentage.toFixed(2), "%");
    console.log(
      "Total count of entries meeting the criteria: ",
      percentages.length
    );
  } catch (error) {
    console.error("Error processing file:", error.message);
  }
};

processFile("projects.csv");
