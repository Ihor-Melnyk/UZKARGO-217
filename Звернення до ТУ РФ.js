function setPropertyRequired(attributeName, boolValue = true) {
  //обов"язкове
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.required = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyHidden(attributeName, boolValue = true) {
  //приховане
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.hidden = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

function setPropertyDisabled(attributeName, boolValue = true) {
  //недоступне
  var attributeProps = EdocsApi.getControlProperties(attributeName);
  attributeProps.disabled = boolValue;
  EdocsApi.setControlProperties(attributeProps);
}

//Скрипт 1. Зміна властивостей атрибутів при створені документа
function onCreate() {
  setContractorRPEmailOnCreate();
  setBranchAndSectionsOnCreate();
}

function setCreateProps() {
  if (CurrentDocument.inExtId) {
    setPropertyRequired("ApplicationKind");
    setPropertyRequired("MakingСhanges");
    setPropertyRequired("Branch");
    setPropertyRequired("VisaHolder");
    setPropertyRequired("StructureDepart");
    setPropertyRequired("RegNumber");
    setPropertyRequired("RegDate");
    setPropertyRequired("Registraion");
  }
}

//Скрипт 2. Зміна властивостей атрибутів після виконання завдання
function onCardInitialize() {
  SendOutDocTask();
  EnterResultsTask();
  ReceiptFundsTask();
  EnterActResultTask();
  setPropOnAddEmployeeTaskOrInformHeadTask();
  setCreateProps();
  EnterResultSpecificationTask();
}

function SendOutDocTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("SendOutDoc").state;
  if (stateTask == "completed") {
    setPropertyDisabled("ApplicationKind");
    setPropertyDisabled("MakingСhanges");
    setPropertyDisabled("TelephoneContactPerson");
    setPropertyDisabled("Branch");
    setPropertyDisabled("StructureDepart");
    setPropertyDisabled("VisaHolder");
    setPropertyDisabled("RegNumber");
    setPropertyDisabled("RegDate");
    setPropertyDisabled("Registraion");
  } else {
    setPropertyDisabled("ApplicationKind", false);
    setPropertyDisabled("MakingСhanges", false);
    setPropertyDisabled("TelephoneContactPerson", false);
    setPropertyDisabled("Branch", false);
    setPropertyDisabled("StructureDepart", false);
    setPropertyDisabled("VisaHolder", false);
    setPropertyDisabled("RegNumber", false);
    setPropertyDisabled("RegDate", false);
    setPropertyDisabled("Registraion", false);
  }
}

//Скрипт 4. Автоматичне визначення email контактної особи Замовника
function setContractorRPEmailOnCreate() {
  if (CurrentDocument.inExtId) {
    var atr = EdocsApi.getInExtAttributes(
      CurrentDocument.id.toString()
    )?.tableAttributes;
    if (atr)
      EdocsApi.setAttributeValue({
        code: "ContractorRPEmail",
        value: EdocsApi.findElementByProperty("code", "ContactPersonEmail", atr)
          ?.value,
        text: null,
      });
  }
}

function sendCommand(routeStage) {
  debugger;
  var command;
  var comment;
  if (routeStage.executionResult == "executed") {
    command = "CompleteTask";
  } else {
    command = "RejectTask";
    comment = routeStage.comment;
  }
  var signatures = EdocsApi.getSignaturesAllFiles();
  var DocCommandData = {
    extSysDocID: CurrentDocument.id,
    extSysDocVersion: CurrentDocument.version,
    command: command,
    legalEntityCode: EdocsApi.getAttributeValue("HomeOrgEDRPOU").value,
    userEmail: EdocsApi.getEmployeeDataByEmployeeID(CurrentUser.employeeId)
      .email,
    userTitle: CurrentUser.fullName,
    comment: comment,
    signatures: signatures,
  };

  routeStage.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processDocCommand", // метод зовнішньої системи
    data: DocCommandData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: false, // виконувати завдання асинхронно
  };
}

function sendComment(comment) {
  debugger;
  var HomeOrgEDRPOU = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var HomeOrgName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!HomeOrgEDRPOU || !HomeOrgName) {
    return;
  }
  //var comment = comment;
  var methodData = {
    extSysDocId: CurrentDocument.id,
    eventType: "CommentAdded",
    comment: comment,
    partyCode: HomeOrgEDRPOU,
    userTitle: CurrentUser.name,
    partyName: HomeOrgName,
    occuredAt: new Date(),
  };
  EdocsApi.runExternalFunction(
    "ESIGN1",
    "integration/processEvent",
    methodData
  );
}

//Скрипт 6. Зміна властивостей атрибутів
function onTaskExecutedAddProtocol(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    EnterResultsTask();
  }
}

function EnterResultsTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("EnterResults")?.state;

  if (
    stateTask == "assigned" ||
    stateTask == "inProgress" ||
    stateTask == "delegated"
  ) {
    setPropertyRequired("ResultMeeting");
    setPropertyHidden("ResultMeeting", false);
    setPropertyDisabled("ResultMeeting", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("ResultMeeting");
    setPropertyHidden("ResultMeeting", false);
    setPropertyDisabled("ResultMeeting");
  } else {
    setPropertyRequired("ResultMeeting", false);
    setPropertyHidden("ResultMeeting");
    setPropertyDisabled("ResultMeeting", false);
  }
}

function onTaskExecuteEnterResults(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("ResultMeeting").value)
      throw `Внесіть значення в поле "Результат розгляду Звернення Комісією"`;
    sendComment(
      `${
        EdocsApi.getAttributeValue("ResultMeeting").value
      } - результат розгляду звернення на стороні АТ "Укрзалізниця". Очікуйте інформацію щодо подальших дій.`
    );
  }
}

//Скрипт 7. Зміна властивостей атрибутів
function onTaskExecutedReceiptFunds(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    ReceiptFundsTask();
  }
}
function ReceiptFundsTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode(
    "ReceiptFunds" + EdocsApi.getAttributeValue("Sections").value
  )?.state;

  if (
    stateTask == "assigned" ||
    stateTask == "inProgress" ||
    stateTask == "delegated"
  ) {
    setPropertyRequired("StatusInvoice");
    setPropertyHidden("StatusInvoice", false);
    setPropertyDisabled("StatusInvoice", false);

    //sendComment("Звернення на видачу ТУ погоджене. Очікуйте інформацію щодо подальших дій.");
  } else if (stateTask == "completed") {
    setPropertyRequired("StatusInvoice");
    setPropertyHidden("StatusInvoice", false);
    setPropertyDisabled("StatusInvoice");
  } else {
    setPropertyRequired("StatusInvoice", false);
    setPropertyHidden("StatusInvoice");
    setPropertyDisabled("StatusInvoice", false);
  }
}

function onTaskExecuteReceiptFunds(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("StatusInvoice").value)
      throw `Внесіть значення в поле "Статус оплати Замовником"`;
  }
}

//Скрипт 8. Зміна властивостей атрибутів
function EnterActResultTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode(
    "EnterActResult" + EdocsApi.getAttributeValue("Sections").value
  )?.state;

  if (
    stateTask == "assigned" ||
    stateTask == "inProgress" ||
    stateTask == "delegated"
  ) {
    setPropertyRequired("ActMeetingResult");
    setPropertyHidden("ActMeetingResult", false);
    setPropertyDisabled("ActMeetingResult", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("ActMeetingResult");
    setPropertyHidden("ActMeetingResult", false);
    setPropertyDisabled("ActMeetingResult");
  } else {
    setPropertyRequired("ActMeetingResult", false);
    setPropertyHidden("ActMeetingResult");
    setPropertyDisabled("ActMeetingResult", false);
  }
}

function onTaskExecuteEnterActResult(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("ActMeetingResult").value)
      throw `Внесіть значення в поле "Результат розгляду акту комісією"`;
  }
}

//Скрипт 1. Зміна властивостей атрибутів
function EnterResultSpecificationTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode(
    "EnterResultSpecification"
  )?.state;

  if (
    stateTask == "assigned" ||
    stateTask == "inProgress" ||
    stateTask == "delegated"
  ) {
    setPropertyRequired("SpesificationResult");
    setPropertyHidden("SpesificationResult", false);
    setPropertyDisabled("SpesificationResult", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("SpesificationResult");
    setPropertyHidden("SpesificationResult", false);
    setPropertyDisabled("SpesificationResult");
  } else {
    setPropertyRequired("SpesificationResult", false);
    setPropertyHidden("SpesificationResult");
    setPropertyDisabled("SpesificationResult", false);
  }
}

function onTaskExecuteEnterResultSpecification(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("SpesificationResult").value)
      throw `Внесіть значення в поле "Результат розгляду ТУ"`;
  }
}

function onChangeStructureDepart() {
  debugger;
  var StructureDepart = EdocsApi.getAttributeValue("StructureDepart").value;
  if (StructureDepart) {
    var data = EdocsApi.findElementByProperty(
      "id",
      StructureDepart,
      EdocsApi.getDictionaryData("Commission")
    ).code; //беремо значення із довідника "StructureDepart" та шукаємо значення в довіднику "Commission"
    setEmployees(data);
  }
}

function setEmployees(data) {
  debugger;
  if (data) {
    const array = data.split(", ");
    var employeeText = null;
    var employee = [];
    for (let index = 0; index < array.length; index++) {
      var employeeById = EdocsApi.getEmployeeDataByEmployeeID(array[index]);
      if (employeeById) {
        employee.push({
          id: 0,
          employeeId: employeeById.employeeId,
          index: index, //потрібно збільшувати на 1
          employeeName: employeeById.shortName,
          positionName: employeeById.positionName,
        });

        employeeText
          ? (employeeText =
              employeeText +
              "\n" +
              employeeById.positionName +
              "\t" +
              employeeById.shortName)
          : (employeeText =
              employeeById.positionName + "\t" + employeeById.shortName);
        employeesValue = `[{"id":0,"employeeId":"${employeeById.employeeId}","index":0,"employeeName":"${employeeById.shortName}","positionName":"${employeeById.positionName}"}]`;
      }
    }
    EdocsApi.setAttributeValue({
      code: "VisaHolder",
      value: JSON.stringify(employee),
      text: employeeText,
    });
  }
}

//Автоматичне визначення розрізу за кодом ЄДРПОУ
function setBranchAndSectionsOnCreate() {
  debugger;
  if (CurrentDocument.inExtId) {
    var atr = EdocsApi.getInExtAttributes(
      CurrentDocument.id.toString()
    )?.tableAttributes;
    if (atr)
      switch (
        atr.find((x) => x.code == "LegalEntityCode" && x.row == "1")?.value
      ) {
        case "40081195":
          EdocsApi.setAttributeValue({
            code: "Branch",
            value: 82,
            text: null,
          });
          EdocsApi.setAttributeValue({
            code: "Sections",
            value: "40081195",
            text: null,
          });
          break;

        case "40081216":
          EdocsApi.setAttributeValue({
            code: "Branch",
            value: 86,
            text: null,
          });
          EdocsApi.setAttributeValue({
            code: "Sections",
            value: "40081216",
            text: null,
          });
          break;

        case "40081237":
          EdocsApi.setAttributeValue({
            code: "Branch",
            value: 252,
            text: null,
          });
          EdocsApi.setAttributeValue({
            code: "Sections",
            value: "40081237",
            text: null,
          });

          break;

        default:
          break;
      }
  }
}

function onTaskExecuteAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("Responsible").value)
      throw `Не заповнено значення поля «Відповідальний працівник»`;
  }
}

//Скрипт 2. Зміна властивостей при призначенні завдання
function onTaskExecutedAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    SendOutDocTask();
  }
}
function SendOutDocTask() {
  debugger;
  var stateTask = EdocsApi.getCaseTaskDataByCode("SendOutDoc")?.state;
  if (
    stateTask == "assigned" ||
    stateTask == "inProgress" ||
    stateTask == "delegated"
  ) {
    setPropertyRequired("VisaHolder");
    setPropertyHidden("VisaHolder", false);
    setPropertyDisabled("VisaHolder", false);
    // setPropertyRequired("TelephoneContactPerson");
    setPropertyHidden("TelephoneContactPerson", false);
    setPropertyDisabled("TelephoneContactPerson", false);
    setPropertyRequired("StructureDepart");
    setPropertyHidden("StructureDepart", false);
    setPropertyDisabled("StructureDepart", false);
    setPropertyRequired("MakingСhanges");
    setPropertyHidden("MakingСhanges", false);
    setPropertyDisabled("MakingСhanges", false);
    setPropertyRequired("ApplicationKind");
    setPropertyHidden("ApplicationKind", false);
    setPropertyDisabled("ApplicationKind", false);
    setPropertyRequired("VisaHolder");
    setPropertyHidden("VisaHolder", false);
    setPropertyDisabled("VisaHolder", false);
    setPropertyRequired("RegNumber");
    setPropertyHidden("RegNumber", false);
    setPropertyDisabled("RegNumber", false);
    setPropertyRequired("RegDate");
    setPropertyHidden("RegDate", false);
    setPropertyDisabled("RegDate", false);
    setPropertyRequired("Registraion");
    setPropertyHidden("Registraion", false);
    setPropertyDisabled("Registraion", false);
  } else if (stateTask == "completed") {
    setPropertyRequired("VisaHolder");
    setPropertyHidden("VisaHolder", false);
    setPropertyDisabled("VisaHolder");
    // setPropertyRequired("TelephoneContactPerson");
    setPropertyHidden("TelephoneContactPerson", false);
    setPropertyDisabled("TelephoneContactPerson");
    setPropertyRequired("StructureDepart");
    setPropertyHidden("StructureDepart", false);
    setPropertyDisabled("StructureDepart");
    setPropertyRequired("MakingСhanges");
    setPropertyHidden("MakingСhanges", false);
    setPropertyDisabled("MakingСhanges");
    setPropertyRequired("ApplicationKind");
    setPropertyHidden("ApplicationKind", false);
    setPropertyDisabled("ApplicationKind");
    setPropertyRequired("VisaHolder");
    setPropertyHidden("VisaHolder", false);
    setPropertyDisabled("VisaHolder");
    setPropertyRequired("RegNumber");
    setPropertyHidden("RegNumber", false);
    setPropertyDisabled("RegNumber");
    setPropertyRequired("RegDate");
    setPropertyHidden("RegDate", false);
    setPropertyDisabled("RegDate");
    setPropertyRequired("Registraion");
    setPropertyHidden("Registraion", false);
    setPropertyDisabled("Registraion");
  } else {
    setPropertyRequired("VisaHolder", false);
    setPropertyHidden("VisaHolder");
    setPropertyDisabled("VisaHolder", false);
    setPropertyRequired("TelephoneContactPerson", false);
    setPropertyHidden("TelephoneContactPerson");
    setPropertyDisabled("TelephoneContactPerson", false);
    setPropertyRequired("StructureDepart", false);
    setPropertyHidden("StructureDepart");
    setPropertyDisabled("ApplicationKind", false);
    setPropertyRequired("ApplicationKind", false);
    setPropertyHidden("ApplicationKind");
    setPropertyDisabled("StructureDepart", false);
    setPropertyRequired("VisaHolder", false);
    setPropertyHidden("VisaHolder");
    setPropertyDisabled("VisaHolder", false);
    setPropertyRequired("RegNumber", false);
    setPropertyHidden("RegNumber");
    setPropertyDisabled("RegNumber", false);
    setPropertyRequired("RegDate", false);
    setPropertyHidden("RegDate");
    setPropertyDisabled("RegDate", false);
    setPropertyRequired("Registraion", false);
    setPropertyHidden("Registraion");
    setPropertyDisabled("Registraion", false);
  }
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("VisaHolder").value)
      throw `Не заповнено значення поля "Інфориаація щодо Технічних умов"`;
    if (!EdocsApi.getAttributeValue("StructureDepart").value)
      throw `Не заповнено значення поля "Постійно-діюча комісія"`;
    if (!EdocsApi.getAttributeValue("VisaHolder").value)
      throw `Не заповнено значення поля "Погоджуючі"`;
  }
}

function onTaskExecuteSendOutDoc(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("RegNumber").value)
      throw `Не заповнено значення поля "Реєстраційний номер"`;
    if (!EdocsApi.getAttributeValue("RegDate").value)
      throw `Не заповнено значення поля "Реєстраційна дата"`;
    if (!EdocsApi.getAttributeValue("Registraion").value)
      throw `Не заповнено значення поля "Реєстрація"`;
    sendComment(
      `Ваше звернення прийняте та зареєстроване за № ${
        EdocsApi.getAttributeValue("RegNumber").value
      } від ${moment(
        new Date(EdocsApi.getAttributeValue("RegDate").value)
      ).format("DD.MM.YYYY")}`
    );
    sendCommand(routeStage);
  }
}

function onTaskExecuteMainTask(routeStage) {
  if (routeStage.executionResult == "rejected") {
    sendCommand(routeStage);
  }
}

//передача коментара в єСайн, додаткових функцій не потрібно
function onTaskCommentedSendOutDoc(caseTaskComment) {
  debugger;
  var orgCode = EdocsApi.getAttributeValue("HomeOrgEDRPOU").value;
  var orgShortName = EdocsApi.getAttributeValue("HomeOrgName").value;
  if (!orgCode || !orgShortName) {
    return;
  }
  var idnumber = CurrentDocument.id;
  //EdocsApi.getAttributeValue("DocId");
  var methodData = {
    extSysDocId: idnumber,
    eventType: "CommentAdded",
    comment: caseTaskComment.comment,
    partyCode: orgCode,
    userTitle: CurrentUser.name,
    partyName: orgShortName,
    occuredAt: new Date(),
  };

  caseTaskComment.externalAPIExecutingParams = {
    externalSystemCode: "ESIGN1", // код зовнішньої системи
    externalSystemMethod: "integration/processEvent", // метод зовнішньої системи
    data: methodData, // дані, що очікує зовнішня система для заданого методу
    executeAsync: true, // виконувати завдання асинхронно
  };
}

//зміна властивостей при паралельних процесах
//Скрипт 1. Зміна властивостей атрибутів полів карточки
function onTaskPickUpedAddEmployee() {
  setPropOnAddEmployeeTaskOrInformHeadTask();
}

function onTaskPickUpedInformHead() {
  setPropOnAddEmployeeTaskOrInformHeadTask();
}

function setPropOnAddEmployeeTaskOrInformHeadTask() {
  debugger
  var CaseTaskAddEmployee = EdocsApi.getCaseTaskDataByCode(
    "AddEmployee" + EdocsApi.getAttributeValue("Sections").value
  );
  var CaseTaskInformHead = EdocsApi.getCaseTaskDataByCode(
    "InformHead" + EdocsApi.getAttributeValue("Sections").value
  );

  //етап AddEmployee взято в роботу, поточний користувач = виконавець завдання AddEmployee
  if (
    (CaseTaskAddEmployee.state == "assigned" &&
      CurrentUser.employeeId == CaseTaskAddEmployee.executorId) ||
    (CaseTaskAddEmployee.state == "inProgress" &&
      CurrentUser.employeeId == CaseTaskAddEmployee.executorId) ||
    (CaseTaskAddEmployee.state == "delegated" &&
      CurrentUser.employeeId == CaseTaskAddEmployee.executorId)
  ) {
    setPropertyRequired("Responsible");
    setPropertyDisabled("Responsible", false);
  } else if (
    //етап InformHead взято в роботу, поточний користувач = виконавець завдання InformHead
    (CaseTaskInformHead.state == "assigned" &&
      CurrentUser.employeeId == CaseTaskInformHead.executorId) ||
    (CaseTaskInformHead.state == "inProgress" &&
      CurrentUser.employeeId == CaseTaskInformHead.executorId) ||
    (CaseTaskInformHead.state == "delegated" &&
      CurrentUser.employeeId == CaseTaskInformHead.executorId)
  ) {
    setPropertyRequired("Responsible", false);
    setPropertyDisabled("Responsible", false);
  } else if (
    CaseTaskAddEmployee.state == "completed" ||
    CaseTaskInformHead.state == "completed"
  ) {
    setPropertyRequired("Responsible");
    setPropertyDisabled("Responsible");
  } else {
    setPropertyRequired("Responsible", false);
    setPropertyDisabled("Responsible", false);
  }
}

function onTaskExecuteAddEmployee(routeStage) {
  debugger;
  if (routeStage.executionResult == "executed") {
    if (!EdocsApi.getAttributeValue("Responsible").value)
      throw `Внесіть значення в поле "Відповідальний працівник"`;
  }
}
