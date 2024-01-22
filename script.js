import { getBusTiming as callBusTimingAPI } from "./sg-bus-api.js";
// ====================================
// Bus Stop List Reference:
// https://observablehq.com/@cheeaun/list-of-bus-stops-in-singapore
// Note, API can return error 500 response (Server-end issue) on extremely high ID inputs. (E.g. Bus Stop ID: 100000)
// Currently there's no handler for this case, as the app would stop working and just print out an error on the
// console log during the fetch command.
//
// Example usable bus IDs:
// 1. 10009
// 2. 52499
// 3. 45009
// 4. 64009
// ====================================
const busIDInput = document.getElementById("bus-stop-id");
const infoText = document.getElementById("bus-arrival-info");
const warningText = document.getElementById("warning");
const scheduleTable = document.getElementById("list-table");

const busStopIDIdentifier = "Bus Stop ID";

const milisecondsPerMin = 60000;
const minutesPerHour = 60;
// ====================================
function getBusTiming() {
  hideWarning();
  hideInfo();
  hideTable();
  clearTableDataRows();

  const idInput = busIDInput.value;

  const requiredFields = [];
  const invalidFields = [];

  if (idInput.trim().length === 0)
    requiredFields.push(busStopIDIdentifier);

  if (requiredFields.length > 0) {
    showWarning(`Missing required field(s). [${requiredFields.join(", ")}]`);
    return;
  }

  if (isNaN(parseInt(idInput)))
    invalidFields.push(busStopIDIdentifier);

  if (invalidFields.length > 0) {
    showWarning(`Invalid input format (Numeric only) on the following field(s). [${invalidFields.join(", ")}].`);
    return;
  }
  showInfo("Loading...");

  displayBusServices(idInput);
}
// ====================================
function displayBusServices(busId) {
  callBusTimingAPI(busId)
  .then((result) => {
    const data = result.data;

    // Debug
    //console.log("Result.", result);

    if (result.success) {
      let services = data.services;
      const now = new Date();

      if (services.length > 0) {

        // Sort by Ascending (Closest ETA to Furthest ETA).
        services = services.sort((element1, element2) => {
          const element1NextMin = new Date(element1.next.time) - now;
          const element2NextMin = new Date(element2.next.time) - now;

          return element1NextMin - element2NextMin;
        });

        for (let i = 0; i < services.length; ++i) {
          const service = services[i];

          const { no, operator, next } = service;

          // Debug
          //console.log(`Info: ${no}, ${operator}, ${next}.`);

          const nextMin = Math.ceil((new Date(next.time) - Date.now()) / milisecondsPerMin);
          const destinationBusStopId = next.destination_code;
          // =================
          // Alternative Approach: Table Display instead of a list of strings.
          // For Task 4.
          let newRow = scheduleTable.insertRow(scheduleTable.rows.length);
          newRow.classList.add("list-table-border");

          let newCell = newRow.insertCell();
          newCell.textContent = no;
          newCell.classList.add("list-table-border");
          newCell.classList.add("list-table-odd-cell");

          newCell = newRow.insertCell();
          newCell.textContent = operator;
          newCell.classList.add("list-table-border");
          newCell.classList.add("list-table-even-cell");

          newCell = newRow.insertCell();
          newCell.textContent = destinationBusStopId;
          newCell.classList.add("list-table-border");
          newCell.classList.add("list-table-odd-cell");

          newCell = newRow.insertCell();
          newCell.textContent = nextMin < 1 ? "Now" : nextMin;
          newCell.classList.add("list-table-border");
          newCell.classList.add("list-table-even-cell");
          // =================
        }

        // Timezone Offset
        // Difference between Universal Timezone (+0/UTC) and Web Server Location's Timezone.
        // E.g. 
        // Let the value of Universal Timezome be "0".
        // Let the value of locations under GMT+8 (like Singapore, Hong Kong, Malaysia) be "8";
        // 0 - 8 = -8.
        // Thus, we need to inverse it to show the format correctly.
        const timezone = now.getTimezoneOffset();
        const gmtHours = formatTime(Math.floor(timezone / minutesPerHour));
        const gmtMinutes = formatTime(now.getTimezoneOffset() % minutesPerHour);

        showInfo(`Data is updated as of ${now.toLocaleString()}, GMT${timezone < 0 ? "+" : "-"}${gmtHours + ":" + gmtMinutes}.`);
        showTable();
      }
      else {
        showWarning(`The Bus Stop [ID: ${busId}] currently has no bus service available.`);
        return;
      }
    }
    else {
      showWarning(result.message);
      return;
    }
  });
}
// ====================================
function formatTime(value) {
  if (value < 0) {
    const valueStr = value.toString();
    return (Math.abs(value) < 10) ? ("0" + valueStr.substring(1)) : value;
  }
  else
    return (value < 10) ? ("0" + value.toString()) : value;
}

function showWarning(str) {
  warningText.innerHTML = str;

  if (warningText.classList.contains("hidden"))
    warningText.classList.remove("hidden");

  hideInfo();
}

function hideWarning() {
  if (!warningText.classList.contains("hidden"))
    warningText.classList.add("hidden");
}

function showInfo(str) {
  infoText.innerHTML = str;

  if (infoText.classList.contains("hidden"))
    infoText.classList.remove("hidden");
}

function hideInfo() {
  if (!infoText.classList.contains("hidden"))
    infoText.classList.add("hidden");
}

function showTable() {
  if (scheduleTable.classList.contains("hidden"))
    scheduleTable.classList.remove("hidden");
}

function hideTable() {
  if (!scheduleTable.classList.contains("hidden"))
    scheduleTable.classList.add("hidden");
}

function clearTableDataRows() {
  for (let i = 1; i < scheduleTable.rows.length;)
    scheduleTable.deleteRow(i);
}
// ====================================
window.getBusTiming = getBusTiming;