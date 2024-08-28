var fs = require('fs'),
  should = require('should'),
  test = require('selenium-webdriver/testing'),
  webdriver = require('selenium-webdriver'),
  request = require('request-promise'),
  XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest,
  By = webdriver.By,
  driver,
  baseUrl = `http://${process.env.BASE_URL}/`,
  testUsername = process.env.TEST_USERNAME,
  testPassword = process.env.TEST_PASSWORD,
  loginUrl = `${baseUrl}authentication/signin`,
  pageHeader = 'page-header',
  chromeCapabilities = webdriver.Capabilities.chrome(),
  chromeOptions = {
    args: ['--no-sandbox', '--window-size=1600, 1800'],
    prefs: {
      'download.default_directory': '/opt/SmokeTest/'
    }
  };
chromeCapabilities.set('chromeOptions', chromeOptions);
const until = webdriver.until;
// Schema Version used enm_sed-1.50.3
var enmSedSchema = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_schema.json');
// Schema Version used enm_sed-1.52.6
var enmSedSchemaSmallIntegrated1526 = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_schema_small_integrated_1_52_6.json');
// Schema Version used enm_sed-1.60.3
var enmSedSchemaSmallIntegrated1603 = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_schema_small_integrated_1_60_3.json');
// Schema Version used enm_sed-1.55.1
var enmSedSchemaVnflcmRequired = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_schema_vnflcm_required.json');
// ENM SED Documents used with enmSedSchema enm_sed-1.50.3 &  enmSedSchemaSmallIntegrated enm_sed-1.52.6
var enmSedDocument = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_document.json');
// ENM SED Documents - enm_sed-1.50.3
var enmSedDocumentEmptyValues = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_document_empty_key_values.json');
var enmSedDocumentEmptyValuesYaml = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_document_empty_key_values.yaml');
// ENM SED Documents used with enmSedSchemaVnflcmRequired enm_sed-1.55.1
var enmSedDocumentVnflcmRequired = fs.readFileSync('/opt/SmokeTest/test_files/enm_sed_document_vnflcm_required.json');
// MCs with enm_sed-1.50.3
var managedConfig5K = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_5K.json');
var managedConfigEcn = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_ECN.json');
var managedConfigFTMI = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_Feature_Test_Multi_Instance.json');
var managedConfigSIEMTO1526 = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_Small_Integrated_ENM_Transport_Only_1_52_6.json');
var managedConfigEcn1526 = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_ECN_1_52_6.json');
var managedConfigSIEMTO1603 = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_Small_Integrated_ENM_Transport_Only_1_60_3.json');
var managedConfigOSIEMTO1603 = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_Optimized_Small_Integrated_ENM_Transport_Only_1_60_3.json');
var managedConfigSIEMMT1603 = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_Small_Integrated_ENM_Multi_Tech_1_60_3.json');
var managedConfigEcn1603 = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_ECN_1_60_3.json');
var managedConfigEmptyValues = fs.readFileSync('/opt/SmokeTest/test_files/managed_config_empty_key_values.json');
// vnflcm_sed_schema-4.9.15
var vnflcmSchema = fs.readFileSync('/opt/SmokeTest/test_files/vnflcm_sed_schema.json');
var vnflcmDocument = fs.readFileSync('/opt/SmokeTest/test_files/vnflcm_document.json');
var vnflcmDocumentEmptyValues = fs.readFileSync('/opt/SmokeTest/test_files/vnflcm_document_empty_key_values.json');
// do_automation-18.1.3
var doSchema = fs.readFileSync('/opt/SmokeTest/test_files/do_automation_schema.json');
var doDocument = fs.readFileSync('/opt/SmokeTest/test_files/do_document.json');
// cENM
var cENMSiteValuesSchema = fs.readFileSync('/opt/SmokeTest/test_files/cenm_sed_schema.json');
var cENMSiteValuesSchemaIPv6 = fs.readFileSync('/opt/SmokeTest/test_files/cenm_sed_schema_ipv6.json');
var cENMDeploymentValues = fs.readFileSync('/opt/SmokeTest/test_files/cenm_sed_schema2.json');
var cENMSiteValuesDoc = fs.readFileSync('/opt/SmokeTest/test_files/cenm_sed_document.json');
var cENMSiteValuesDocIPv6 = fs.readFileSync('/opt/SmokeTest/test_files/cenm_sed_document_ipv6.json');
var cENMDeplymentValuesDoc = fs.readFileSync('/opt/SmokeTest/test_files/cenm_sed_document2.json');
var cENMSiteValuesMC = fs.readFileSync('/opt/SmokeTest/test_files/cenm_mc_test.json');
var cENMSiteValuesMC2 = fs.readFileSync('/opt/SmokeTest/test_files/cenm_mc_test2.json');

var healthTestsFailed = false;
var failedHealthTestsMessage = '\nFailed tests: ';

var MAX_RETRIES = 0;

var response,
  ditAdminInformation,
  schemaREST1,
  schemaREST2,
  schemaREST3,
  labelREST1,
  labelREST2,
  labelREST3,
  labelREST4,
  labelREST5,
  labelREST6,
  managedConfigREST1,
  managedConfigREST2,
  managedConfigREST3,
  managedConfigREST4,
  managedConfigREST5,
  managedConfigREST6,
  managedConfigREST7,
  managedConfigREST8,
  managedConfigREST9,
  enmDocumentREST1,
  enmDocumentREST2,
  enmVnfLcmDocumentREST1,
  doDocumentREST1,
  podREST1,
  projectREST1,
  deploymentREST1;

async function asyncForEach(array, callBack) {
  for (var i = 0; i < array.length; i += 1) {
    await callBack(array[i], i, array); //eslint-disable-line
  }
}

async function removeHealthCheckArtifacts() {
  var objectTypes = ['groups', 'deployments', 'projects', 'pods', 'documents', 'schemas', 'labels'];

  await asyncForEach(objectTypes, async function (objectType) {
    if (objectType === 'documents') {
      var documentTypes = [
        { button: '.createEnmSed', url: '/list/enm_sed' },
        { button: '.createVnfLcmSed', url: '/list/vnflcm_sed' },
        { button: '.createManagedConfig', url: '/list/managedconfigs' },
        { button: '.createOther', url: '/list/other' }
      ];
      await asyncForEach(documentTypes, async function (documentType) {
        await removeHealthCheckArtifactsByObjectType(objectType, documentType.button, documentType.url);
      });
    } else {
      await removeHealthCheckArtifactsByObjectType(objectType, '.create');
    }
  });
}

async function removeHealthCheckArtifactsByObjectType(objectType, createButton, extraUrl) {
  var subObjectType = (objectType === 'documents') ? createButton.replace('.create', '') : '';
  // eslint-disable-next-line no-console
  console.log(`\n\tSearching for ${objectType}${subObjectType ? `-${subObjectType}` : ''} Health-Check Artifacts`);
  var objectTypeButton = objectType + createButton;
  var objectTypeUrl = `${objectType}${extraUrl || ''}`;
  await driver.get(baseUrl + objectTypeUrl);
  await driver.wait(until.elementLocated(By.css(`[ui-sref="${objectTypeButton}"]`)), 30000);


  // find elements
  var findValuePrepend = 'A_Health_';
  var tdColumn = 1;
  if (objectType === 'schemas') {
    findValuePrepend = '999.999.';
    tdColumn = 2;
  }

  var foundArtifactTds = await driver.findElements(By.xpath(`//td[${tdColumn} and contains(.,"${findValuePrepend}")]`));

  if (!foundArtifactTds.length) {
    // eslint-disable-next-line no-console
    console.log(`\tNo Health-Check Artifacts Exist for ${objectType}${subObjectType ? `-${subObjectType}` : ''}`);
    return;
  }

  var artifactFindValues = [];
  await asyncForEach(foundArtifactTds, async function (artifactTd) {
    artifactFindValues.push(await artifactTd.getText());
  });

  await asyncForEach(artifactFindValues, async function (artifactFindValue) {
    var artifactName = artifactFindValue;
    if (objectType === 'schemas') {
      var artifactFindValueTd = await driver.findElement(By.xpath(`//td[contains(.,"${artifactFindValue}")]`));
      artifactName = await artifactFindValueTd.findElement(By.xpath('//preceding-sibling::td[1]')).getText();
    }
    // eslint-disable-next-line no-console
    console.log(`\tArtifact Found. Name: ${artifactName}, Find-Value: ${artifactFindValue}`);
    var artifactDeleted = false;
    try {
      artifactDeleted = !(await deleteItem(objectTypeButton, artifactName, artifactFindValue, ''));
    } catch (deletionErr) {
      var errMsg = '\tCaught error whilst removing Health-Check Artifact';
      // eslint-disable-next-line no-console
      console.log(`${errMsg}: ${artifactName} ${(objectType === 'schemas') ? artifactFindValue : ''} - ${deletionErr.message}`);
    }
    if (artifactDeleted) {
      // eslint-disable-next-line no-console
      console.log(`\tSuccessfully removed Health-Check Artifact: ${artifactName} ${(objectType === 'schemas') ? artifactFindValue : ''}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`\tFailed to remove Health-Check Artifact: ${artifactName} ${(objectType === 'schemas') ? artifactFindValue : ''}`);
    }
  });
}

async function deleteItem(objTypeButton, name, findValue, objUrl, expectedToDelete = true) {
  if (objUrl) {
    await driver.get(`${baseUrl}${objUrl}`);
  }
  await driver.wait(until.elementLocated(By.css(`[ui-sref="${objTypeButton}"]`)), 30000);
  await driver.wait(until.elementLocated(By.xpath(`//td[contains(.,"${name}")]`)), 10000);
  var elementId = await driver.findElement(By.css('table[id$=list-table]')).getAttribute('id').then(function (promiseResult) {
    return promiseResult;
  });
  var baseTableRowXPath = '/html/body/div/section/section/section/ui-view/section/table/tbody/';
  if (elementId.endsWith('list-table')) {
    baseTableRowXPath = `//*[@id="${elementId}"]/tbody/`;
  }
  var deleteButton = '';
  var foundArtifactVersion = name;

  try {
    var i = 1;
    for (; ;) {
      var nameXPath = 'td[1]';
      var deleteButtonXPath = 'td[contains(.,"Delete")]/button[contains(.,"Delete")]';
      var rowIndexXPath = `tr[${i}]/`;
      var rowXPath = baseTableRowXPath + rowIndexXPath;
      var itemNameXPath = rowXPath + nameXPath;
      // eslint-disable-next-line no-await-in-loop
      var foundName = await driver.findElement(By.xpath(itemNameXPath)).getText();

      // if it is schema page
      if (objTypeButton.includes('schemas.create')) {
        // eslint-disable-next-line no-await-in-loop
        foundArtifactVersion = await driver.findElement(By.xpath(`${rowXPath}td[2]`)).getText();
      }
      if (foundName === name && foundArtifactVersion === findValue) {
        deleteButton = rowXPath + deleteButtonXPath;
        break;
      }
      i += 1;
    }
  } catch (err) {
    // do nothing finishes with error when checking a table
  }
  try {
    await driver.findElement(By.xpath(deleteButton)).click();
  } catch (err) {
    throw err;
  }
  await driver.sleep(500);
  await driver.switchTo().alert().accept();
  await driver.wait(until.elementLocated(By.css(`[ui-sref="${objTypeButton}"]`)), 5000);
  await driver.sleep(80);
  if (expectedToDelete) {
    (await driver.findElement(By.xpath('//div[contains(.,"deleted successfully!")]')).isDisplayed()).should.equal(true);
  } else {
    (await driver.findElement(By.xpath('//h3[contains(.,"deletion failed!")]')).isDisplayed()).should.equal(true);
  }
  var found = await driver.findElement(By.xpath(`//td[contains(.,"${findValue}")]`)).then(function () {
    return true;
  }, function (err) {
    if (err instanceof webdriver.error.NoSuchElementError) {
      return false;
    }
  });
  return found;
}

async function findItemInTable(name) {
  var rowXPath = '';
  var elementId = await driver.findElement(By.css('table[id$=list-table]')).getAttribute('id').then(function (promiseResult) {
    return promiseResult;
  });
  var baseTableRowXPath = '/html/body/div/section/section/section/ui-view/section/table/tbody/';
  if (elementId.endsWith('list-table')) {
    baseTableRowXPath = `//*[@id="${elementId}"]/tbody/`;
  }

  try {
    var i = 1;
    for (; ;) {
      var nameXPath = 'td[1]';
      var rowIndexXPath = `tr[${i}]`;
      rowXPath = baseTableRowXPath + rowIndexXPath;
      var itemNameXPath = `${rowXPath}/${nameXPath}`;
      // eslint-disable-next-line no-await-in-loop
      var foundName = await driver.findElement(By.xpath(itemNameXPath)).getText();
      if (foundName === name) {
        break;
      }
      i += 1;
    }
  } catch (err) {
    // do nothing finishes with error when checking a table
  }
  return rowXPath;
}

async function removeFile(fileName) {
  try {
    fs.unlinkSync(fileName);
  } catch (err) {
    // try-catch required to stop an error to be thrown by deletion failure.
  }
}

async function jsonHasEmptyValue(obj) {
  for (var key in obj.parameters) {
    if (Object.prototype.hasOwnProperty.call(obj.parameters, key)) {
      if (obj.parameters[key] === null || obj.parameters[key] === undefined || obj.parameters[key] === '') {
        return true;
      }
    }
  }
  return false;
}

async function accessArtifactView(objUrl, artifact) {
  await driver.get(`${baseUrl}${objUrl}/view/${artifact._id}`);
  await driver.sleep(500);
}

async function select2Field(selectElement, value, cssType) {
  if (cssType) {
    await driver.findElement(By.css(`[aria-controls="select2-${selectElement}-container"]`)).click();
  } else {
    await driver.findElement(By.id(`select2-${selectElement}-container`)).click();
  }
  await driver.findElement(By.className('select2-search__field')).sendKeys(value + webdriver.Key.ENTER);
}

async function accessCreateArtifactView(objType, objUrl) {
  await driver.get(baseUrl + objUrl);
  await driver.wait(until.elementLocated(By.css(`[ui-sref="${objType}"]`)), 30000);
  await driver.findElement(By.css(`[ui-sref="${objType}"]`)).click();
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Creating")]')), 5000);
  await driver.wait(until.elementLocated(By.id('name')), 30000);
}

async function accessEditArtifactView(objType, objUrl, name) {
  await driver.get(baseUrl + objUrl);
  await driver.wait(until.elementLocated(By.css(`[ui-sref="${objType}"]`)), 30000);
  var linkLocation = await findItemInTable(name);
  var element = await driver.findElement(By.xpath(linkLocation));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
  element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Editing")]')), 5000);
}

async function newSchemaSetup(name, version, content) {
  content = String(content);
  await accessCreateArtifactView('schemas.create', 'schemas');
  await driver.findElement(By.css('[ng-model="vm.schema.name"]')).sendKeys(name);
  await driver.findElement(By.css('[ng-model="vm.schema.version"]')).sendKeys(version);
  await driver.findElement(By.css('[ng-model="vm.schema.content"]')).click();
  var element = await driver.findElement(By.css('[ng-model="vm.schema.content"]'));
  await driver.executeScript('arguments[0].innerHTML=arguments[1]', element, content);
  await driver.findElement(By.css('[ng-model="vm.schema.content"]')).sendKeys(webdriver.Key.ENTER);
  await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
  element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
  (await driver.findElement(By.xpath('//div[contains(.,"Schema created successfully!")]')).isDisplayed()).should.equal(true);
}

async function newLabelSetup(name, category = 'size') {
  await accessCreateArtifactView('labels.create', 'labels');
  await driver.findElement(By.id('name')).sendKeys(name);
  await driver.findElement(By.id('category')).click();
  await driver.findElement(By.id('category')).sendKeys(category);
  await driver.findElement(By.id('category')).sendKeys(webdriver.Key.ENTER);
  var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
  (await driver.findElement(By.xpath('//div[contains(.,"Label creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newManageConfigSetup(name, schemaName, label, content) {
  content = String(content);
  await accessCreateArtifactView('documents.createManagedConfig', 'documents/list/managedconfigs');
  await driver.findElement(By.id('name')).sendKeys(name);
  await driver.findElement(By.css('[title="Labels"]')).click();
  await driver.findElement(By.css('[ng-class="classesBtn"]')).click();
  await driver.findElement(By.xpath(`//a[contains(.,"${label}")]`)).click();
  await driver.findElement(By.css('[class="label label-primary ng-binding ng-scope"]'));
  await select2Field('schema', schemaName);
  await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
  await driver.findElement(By.id('pasteMode')).click();
  await driver.wait(until.elementLocated(By.id('document_json')), 30000);
  await driver.findElement(By.id('document_json')).click();
  await driver.findElement(By.id('document_json')).clear();
  var element = await driver.findElement(By.id('document_json'));
  await driver.executeScript('arguments[0].value=arguments[1]', element, content);
  await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
  await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
  element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newDocumentPMsetup(name, schemaName, content, objType, objUrl) {
  content = String(content);
  await accessCreateArtifactView(`documents.${objType}`, `documents/list/${objUrl}`);
  await driver.findElement(By.id('name')).sendKeys(name);
  await select2Field('schema', schemaName);
  await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
  await driver.findElement(By.id('pasteMode')).click();
  await driver.wait(until.elementLocated(By.id('document_json')), 30000);
  await driver.findElement(By.id('document_json')).click();
  await driver.findElement(By.id('document_json')).clear();
  var element = await driver.findElement(By.id('document_json'));
  await driver.executeScript('arguments[0].value=arguments[1]', element, content);
  await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
  await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
  element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newPodSetup(name) {
  await accessCreateArtifactView('pods.create', 'pods');
  await driver.findElement(By.id('name')).sendKeys(name);
  await driver.findElement(By.id('authUrl')).sendKeys('https://newpod.com');
  await driver.findElement(By.id('networks[0].name')).sendKeys('network1');
  await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('100');
  await driver.findElement(By.id('networks[0].vrrp_range.end')).sendKeys('255');
  await driver.findElement(By.id('networks[0].ipv4_subnet.cidr')).sendKeys('10.150.241.0/24');
  await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys('10.150.241.1');
  await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add IPv6 Subnet")]')), 30000);
  var element = await driver.findElement(By.xpath('//button[contains(.,"Add IPv6 Subnet")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.findElement(By.id('networks[0].ipv6_subnet.cidr')).sendKeys('2001:1b70:6207:2a::/64');
  await driver.findElement(By.id('networks[0].ipv6_subnet.gateway_ip')).sendKeys('2001:1b70:6207:2a:0:879:0:1');
  element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newProjectSetup(
  name, podName, IPv4StartRange = '10.150.241.171', IPv4EndRange = '10.150.241.231',
  IPv6StartRange = '2001:1b70:6207:2a:0000:0000:0000:0010', IPv6EndRange = '2001:1b70:6207:2a:0000:0000:0000:0050'
) {
  await accessCreateArtifactView('projects.create', 'projects');
  await driver.wait(until.elementLocated(By.id('pod-select')), 30000);
  await select2Field('pod-select', podName);
  await driver.findElement(By.id('name')).sendKeys(name);
  await driver.findElement(By.id('id')).sendKeys('123456789101112131415');
  await driver.findElement(By.id('username')).sendKeys('projectUser');
  await driver.findElement(By.id('password')).sendKeys('project1');
  await select2Field('network-select', 'network1');
  await driver.findElement(By.id('network.ipv4_ranges[0].start')).sendKeys(IPv4StartRange);
  await driver.findElement(By.id('network.ipv4_ranges[0].end')).sendKeys(IPv4EndRange);
  await driver.wait(until.elementLocated(By.id('ipv6RangeBtn')), 30000);
  var element = await driver.findElement(By.id('ipv6RangeBtn'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.id('network.ipv6_ranges[0].start')), 30000);
  await driver.findElement(By.id('network.ipv6_ranges[0].start')).sendKeys(IPv6StartRange);
  await driver.findElement(By.id('network.ipv6_ranges[0].end')).sendKeys(IPv6EndRange);
  element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newDeploymentSetup(name, projectName, sedName) {
  await accessCreateArtifactView('deployments.create', 'deployments');
  await driver.findElement(By.id('name')).sendKeys(name);
  await select2Field('project-select', projectName);
  await select2Field('enm-sed-select', sedName);
  var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newDeploymentSetupWithVnflcm(name, projectName, enmSedName, vnflcmName) {
  await accessCreateArtifactView('deployments.create', 'deployments');
  await driver.findElement(By.id('name')).sendKeys(name);
  await select2Field('project-select', projectName);
  await select2Field('enm-sed-select', enmSedName);
  await driver.wait(until.elementLocated(By.id('select2-vnfLcm-sed-select-container')), 1000);
  await select2Field('vnfLcm-sed-select', vnflcmName);
  var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

async function newGroupSetup(name) {
  await accessCreateArtifactView('groups.create', 'groups');
  var element = await driver.wait(until.elementLocated(By.id('name')));
  await element.click();
  await element.sendKeys(name);
  await driver.findElement(By.name('adminPrimary')).sendKeys('dittest');
  await driver.findElement(By.name('adminSecondary')).sendKeys('ejamfur');
  element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
  await driver.executeScript('arguments[0].click()', element);
  await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
  (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
}

var testErrorNumber = 0;
async function takeScreenshot(name) {
  await driver.sleep(2000);
  testErrorNumber += 1;
  var screenshotData = await driver.takeScreenshot();
  var base64Data = screenshotData.replace(/^data:image\/png;base64,/, '');
  fs.writeFile(`images/${testErrorNumber}_${name}.png`, base64Data, 'base64', function () { });
}

function writeHealthCheckReport(data) {
  fs.writeFileSync('images/healthTestReport.txt', data, (err) => {
    // eslint-disable-next-line no-console
    console.log('Failed to write the Health-Check Log File');
  });
}

// REST Functions
async function ditSignInREST(username, password) {
  try {
    response = await request.post(`${baseUrl}api/auth/signin`).auth(testUsername, testPassword).form({ username: username, password: password });
    response = JSON.parse(response);
    return response;
  } catch (requestErr) {
    throw new Error(`Failed to sign-in for username ${username}. Received message with status ${requestErr.message}`);
  }
}

async function createArtifactREST(artifactType, artifactData, variableName) {
  try {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', `${baseUrl}api/${artifactType}`, true, testUsername, testPassword);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.withCredentials = true;
    var json = artifactData;
    await xhr.send(JSON.stringify(json));
    xhr.onreadystatechange = async function () {
      if (xhr.readyState === 4) { // if complete
        if (xhr.status === 200 || xhr.status === 201) { // check if "OK" (200)
          // success
          var jsonResponse = JSON.parse(xhr.responseText);
          await setVariable(variableName, jsonResponse);
          return 'Created Artifact';
        }
        throw new Error(`Failed to create ${artifactType} artifact. Received message with status ${xhr.responseText} and code ${xhr.status}.`);
      }
    };
  } catch (err) {
    throw new Error(`Failed to create ${artifactType} artifact throught REST API.`);
  }
}

async function deleteArtifactREST(artifactType, artifact, artifactName, deleteLogs, safeMode) {
  var artifactId = (artifact) ? artifact._id : undefined;
  if (artifactName) {
    response = await request.get(`${baseUrl}api/${artifactType}?q=name=${artifactName}`).auth(testUsername, testPassword);
    var artifactsFound = JSON.parse(response);
    if (artifactsFound && artifactsFound.length > 0) {
      artifactId = artifactsFound[0]._id;
    }
  }
  try {
    response = await request.delete(`${baseUrl}api/${artifactType}/${artifactId}`).auth(testUsername, testPassword);
  } catch (requestErr) {
    if (!requestErr.message.startsWith('404') || requestErr.message.includes('id does not exist')) {
      if (!safeMode) throw new Error(`Failed to delete ${artifactType} artifact. Received message with status ${requestErr.message}`);
    }
  }
  if (deleteLogs) {
    try {
      response = await request.delete(`${baseUrl}api/logs/${artifactType}`).auth(testUsername, testPassword);
    } catch (requestErr) {
      if (!requestErr.message.startsWith('404')) {
        if (!safeMode) throw new Error(`Failed to delete ${artifactType} artifact logs. Received message with status ${requestErr.message}`);
      }
    }
  }
  await driver.sleep(500); // Allow rest call to complete
}

async function setVariable(name, value) {
  switch (name) {
    case 'labelREST1':
      labelREST1 = value;
      break;
    case 'labelREST2':
      labelREST2 = value;
      break;
    case 'labelREST3':
      labelREST3 = value;
      break;
    case 'labelREST4':
      labelREST4 = value;
      break;
    case 'labelREST5':
      labelREST5 = value;
      break;
    case 'labelREST6':
      labelREST6 = value;
      break;
    case 'schemaREST1':
      schemaREST1 = value;
      break;
    case 'schemaREST2':
      schemaREST2 = value;
      break;
    case 'schemaREST3':
      schemaREST3 = value;
      break;
    case 'managedConfigREST1':
      managedConfigREST1 = value;
      break;
    case 'managedConfigREST2':
      managedConfigREST2 = value;
      break;
    case 'managedConfigREST3':
      managedConfigREST3 = value;
      break;
    case 'managedConfigREST4':
      managedConfigREST4 = value;
      break;
    case 'managedConfigREST5':
      managedConfigREST5 = value;
      break;
    case 'managedConfigREST6':
      managedConfigREST6 = value;
      break;
    case 'managedConfigREST7':
      managedConfigREST7 = value;
      break;
    case 'managedConfigREST8':
      managedConfigREST8 = value;
      break;
    case 'managedConfigREST9':
      managedConfigREST9 = value;
      break;
    case 'enmDocumentREST1':
      enmDocumentREST1 = value;
      break;
    case 'enmDocumentREST2':
      enmDocumentREST2 = value;
      break;
    case 'enmVnfLcmDocumentREST1':
      enmVnfLcmDocumentREST1 = value;
      break;
    case 'doDocumentREST1':
      doDocumentREST1 = value;
      break;
    case 'podREST1':
      podREST1 = value;
      break;
    case 'projectREST1':
      projectREST1 = value;
      break;
    case 'deploymentREST1':
      deploymentREST1 = value;
      break;
    default:
    // do nothing
  }
}

async function select2DropdownSelect(idValue, searchedValue) {
  await driver.sleep(500);
  await driver.wait(until.elementLocated(By.id(`select2-${idValue}-container`)), 5000);
  await driver.findElement(By.id(`select2-${idValue}-container`)).click();
  await driver.sleep(500);
  await driver.wait(until.elementLocated(By.className('select2-search__field')), 5000);
  await driver.findElement(By.className('select2-search__field')).sendKeys(searchedValue + webdriver.Key.ENTER);
  await driver.sleep(500);
}

async function createSchemaREST(schemaName, schemaVersion, enmSedSchema, variableName) {
  var content = String(enmSedSchema);
  content = JSON.parse(content);
  var json = { name: schemaName, version: schemaVersion, content };
  await createArtifactREST('schemas', json, variableName);
}

async function createLabelREST(labelName, category, variableName) {
  await createArtifactREST('labels', { name: labelName, category: category }, variableName);
}

async function createManagedConfigREST(managedConfigName, schemaId, labelName, managedConfigContent, variableName) {
  var content = String(managedConfigContent);
  content = JSON.parse(content);
  var json = {
    name: managedConfigName,
    schema_id: schemaId,
    managedconfig: true,
    autopopulate: false,
    dns: true,
    ipv6: false,
    managedconfigs: [],
    overcommit: false,
    usergroups: [],
    vio: false,
    labels: [labelName],
    content
  };
  await createArtifactREST('documents', json, variableName);
}

async function createPodREST(podName, variableName) {
  var networks = [{
    name: 'network1',
    ipv4_subnet: {
      cidr: '10.150.241.0/24',
      gateway_ip: '10.150.241.1'
    },
    ipv6_subnet: {
      cidr: '2001:1b70:6207:2a::/64',
      gateway_ip: '2001:1b70:6207:2a:0:879:0:1'
    },
    vrrp_range: {
      start: 100,
      end: 255
    }
  }];
  var json = {
    name: podName,
    authUrl: 'https://newpod.com',
    networks
  };
  await createArtifactREST('pods', json, variableName);
}

async function createProjectREST(projectName, podId, networkName, ipv4Start, ipv4End, ipv6Start, ipv6End, variableName) {
  var network = {
    name: networkName,
    ipv4_ranges: [{ start: ipv4Start, end: ipv4End }],
    ipv6_ranges: [{ start: ipv6Start, end: ipv6End }]
  };
  var json = {
    name: projectName,
    id: '123456789101112131415',
    pod_id: podId,
    username: 'projectUser',
    password: 'project1',
    exclusion_ipv4_addresses: [],
    exclusion_ipv6_addresses: [],
    network
  };
  await createArtifactREST('projects', json, variableName);
}

async function createDocumentPMREST(documentName, schemaId, documentContent, variableName) {
  var content = String(documentContent);
  content = JSON.parse(content);

  var json = {
    name: documentName,
    schema_id: schemaId,
    managedconfig: false,
    autopopulate: true,
    dns: true,
    ipv6: false,
    managedconfigs: [],
    overcommit: false,
    usergroups: [],
    labels: [],
    vio: false,
    content
  };

  await createArtifactREST('documents', json, variableName);
}

async function createDeploymentREST(deploymentName, projectId, enmSedId, variableName, vnflcmSchemaName, vnflcmSedId) {
  var json = {
    name: deploymentName,
    documents: [],
    enm: {
      sed_id: enmSedId
    },
    project_id: projectId,
    jira_issues: []
  };
  if (vnflcmSchemaName && vnflcmSedId) {
    json.documents.push({
      document_id: vnflcmSedId,
      schema_category: 'vnflcm',
      schema_name: vnflcmSchemaName
    });
  }
  await createArtifactREST('deployments', json, variableName);
}

describe('DIT Smoke Tests', function () {
  var projectName = 'Anewproject';
  var podName = 'Anewpod';
  var enmSedName = 'Anewsed';
  var vnflcmSedName = 'Anewvnflcm';
  var deploymentName = 'Anewdeployment';
  var enmSchemaName = 'enm_sed';
  var beforeSuccessful;

  before(async function () {
    this.timeout(30000);
    driver = await new webdriver.Builder()
      .forBrowser('chrome')
      .withCapabilities(chromeCapabilities)
      .build();

    // Get DIT Admin Information from API
    ditAdminInformation = await ditSignInREST(testUsername, testPassword);

    // Log in test user first
    // eslint-disable-next-line no-console
    console.log(`Navigating to login address:${loginUrl}`);
    await driver.get(loginUrl);
    await driver.wait(until.elementLocated(By.name('username')), 30000);
    await driver.findElement(By.name('username')).sendKeys(testUsername);
    await driver.findElement(By.name('password')).sendKeys(testPassword);
    await driver.findElement(By.css('[class="ebBtn eaLogin-formButton"]')).click();
    await driver.wait(until.elementLocated(By.css('[alt="vENM Steps"]')), 30000);
    // eslint-disable-next-line no-console
    console.log('Login complete.');
  });

  describe('Webtool Title @healthtest @jenkins', function () {
    this.timeout(10000);
    this.retries(MAX_RETRIES);
    it('should get title of DIT', async function () {
      await driver.get(baseUrl);
      var title = await driver.getTitle();
      title.should.containEql('Deployment Inventory Tool');
    });

    afterEach(async function () {
      if (this.currentTest.state === 'failed') {
        await takeScreenshot(this.currentTest.fullTitle().replace(/ /g, '_'));
        healthTestsFailed = true;
        failedHealthTestsMessage += `\n ${this.currentTest.fullTitle().replace(/ /g, '_')}`;
      }
    });
  });

  describe('Header @healthtest @jenkins', function () {
    this.timeout(30000);
    this.retries(MAX_RETRIES);
    it('should get header title of DIT', async function () {
      await driver.get(baseUrl);
      await driver.wait(until.elementLocated(By.className('navbar-brand')), 30000);
      var headerTitle = (await driver.findElement(By.className('navbar-brand')).getText());
      headerTitle.should.containEql('Deployment Inventory Tool');
    });

    it('should get header of Schemas page ', async function () {
      await driver.get(`${baseUrl}schemas`);
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Schemas")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Projects page ', async function () {
      await driver.get(`${baseUrl}projects`);
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Projects")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Deployments page ', async function () {
      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Deployments")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Labels page ', async function () {
      await driver.get(`${baseUrl}labels`);
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Labels")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Pods page ', async function () {
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Pods")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of vENM SEDs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Documents")]')).click();
      await driver.findElement(By.css('[ui-sref="documents.listSeds({})"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"vENM SEDs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of cENM SEDs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Documents")]')).click();
      await driver.findElement(By.css('[ui-sref="documents.listcENMSeds({})"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"cENM SEDs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of VNF LCM SEDs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.className('dropdown-toggle')).click();
      await driver.findElement(By.css('[ui-sref="documents.listVnfLcmSeds({})"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"VNF LCM SEDs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Managed Configs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Documents")]')).click();
      await driver.findElement(By.css('[ui-sref="documents.listManagedConfigs({})"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Managed Configs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Other Documents page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Documents")]')).click();
      await driver.findElement(By.css('[ui-sref="documents.listOther({})"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Other Documents")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Groups page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.sleep(500);
      await driver.findElement(By.xpath('//a[contains(.,"Application ID required for automated tests")]')).click();
      await driver.findElement(By.css('[ui-sref="groups.list"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Groups")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Admins page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.sleep(500);
      await driver.findElement(By.xpath('//a[contains(.,"Application ID required for automated tests")]')).click();
      await driver.wait(until.elementLocated(By.css('[ui-sref="users.list"]')), 30000);
      await driver.findElement(By.css('[ui-sref="users.list"]')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Admins")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Schema logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[1]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Schemas Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Document logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[2]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Pod logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[3]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Pods Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Project logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[4]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Projects Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Deployment logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[5]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Deployments Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Label logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[6]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Labels Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    it('should get header of Group logs page ', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[7]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Groups Historical Logs")]')).isDisplayed()).should.equal(true);
    });

    afterEach(async function () {
      if (this.currentTest.state === 'failed') {
        await takeScreenshot(this.currentTest.fullTitle().replace(/ /g, '_'));
        healthTestsFailed = true;
        failedHealthTestsMessage += `\n ${this.currentTest.fullTitle().replace(/ /g, '_')}`;
      }
    });
  });

  describe('Create Managed Config @jenkins', function () {
    this.timeout(80000);
    this.retries(MAX_RETRIES);
    var schemaVersion = '0.0.3';
    var label5KTEST = '5KTEST';
    var labelECNTest = 'ECNTest';
    var labelECNTest2 = 'ECNTest2';
    var labelDuplicateMCTest = 'DuplicateMCTest';
    beforeSuccessful = false;
    before(async function () {
      await createSchemaREST(enmSchemaName, schemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);
      await createLabelREST(label5KTEST, 'size', 'labelREST1');
      await createLabelREST(labelECNTest, 'site', 'labelREST2');
      await createLabelREST(labelDuplicateMCTest, 'size', 'labelREST3');
      await createLabelREST(labelECNTest2, 'site', 'labelREST4');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should not display document options for managed configs', async function () {
      var managedConfigName = 'managed_config_NDO';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createManagedConfig', 'documents/list/managedconfigs');
      await driver.findElement(By.id('name')).sendKeys(managedConfigName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      (await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).isDisplayed()).should.equal(false);
    });

    it('should show invalid json error', async function () {
      var content = 'invalid_json';
      var managedConfigName = 'Testing_json_check';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createManagedConfig', 'documents/list/managedconfigs');
      await driver.findElement(By.id('name')).sendKeys(managedConfigName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      await driver.findElement(By.id('document_json')).sendKeys(content);
      (await driver.findElement(By.xpath('//p[contains(.,"This should be valid JSON")]')).isDisplayed()).should.equal(true);
    });

    it('should fix the parent key in paste mode for a managed config, when user enters invalid parent key', async function () {
      var content = String(managedConfig5K).replace('"parameters":', '"parameter_defaults":');
      var managedConfigName = 'Testing_MC';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createManagedConfig', 'documents/list/managedconfigs');
      await driver.findElement(By.id('name')).sendKeys(managedConfigName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Document JSON was invalid');
      await driver.switchTo().alert().accept();
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${managedConfigName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, 'Testing_MC', false, false);
    });

    it('should remove empty key values from json in paste mode', async function () {
      var content = String(managedConfigEmptyValues);
      (await jsonHasEmptyValue(JSON.parse(content))).should.equal(true);
      var managedConfigName = 'MC_remove_empty_json_key_values';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createManagedConfig', 'documents/list/managedconfigs');
      await driver.findElement(By.id('name')).sendKeys(managedConfigName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      (await jsonHasEmptyValue(JSON.parse(jsonContent))).should.equal(false);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${managedConfigName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, 'MC_remove_empty_json_key_values', false, false);
    });

    it('should create 5K managed config and see it in managed configs list', async function () {
      var managedConfigName = `${label5KTEST}_${schemaVersion}`;
      await createManagedConfigREST(managedConfigName, schemaREST1._id, label5KTEST, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);
      await driver.get(`${baseUrl}documents/list/managedconfigs`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createManagedConfig"]')), 30000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${managedConfigName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
    });

    it('should create ECN managed config', async function () {
      var managedConfigName = `${labelECNTest}_${schemaVersion}`;
      await createManagedConfigREST(managedConfigName, schemaREST1._id, labelECNTest, managedConfigEcn, 'managedConfigREST1');
      await driver.sleep(1500);
      await driver.get(`${baseUrl}documents/list/managedconfigs`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createManagedConfig"]')), 30000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${managedConfigName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST2, false, false, false);
    });

    it('should create ECN managed config SNAPSHOT and not create a log for it', async function () {
      var managedConfigName = `${labelECNTest2}_${schemaVersion}SNAPSHOT`;
      await createManagedConfigREST(managedConfigName, schemaREST1._id, labelECNTest2, managedConfigEcn, 'managedConfigREST1');
      await driver.sleep(1500);
      await driver.get(`${baseUrl}documents/list/managedconfigs`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createManagedConfig"]')), 30000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${managedConfigName}")]`)).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}logs/documents`);
      await driver.sleep(30000);
      (await driver.findElement(By.xpath('//td[contains(.,"No data available in table")]')).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST4, false, false, false);
    });

    it('should not allow the creation of two managed configs with the same schema_id', async function () {
      // Prepare managed config variables
      var mc1Name = 'managed_config_1';
      var mc2Name = 'managed_config_2';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      var mc2Content = String(managedConfigEcn);

      // Create 1st managed config - quick version
      await createManagedConfigREST(mc1Name, schemaREST1._id, labelDuplicateMCTest, managedConfigEcn, 'managedConfigREST1');
      await driver.sleep(1500);
      await accessArtifactView('documents', managedConfigREST1);
      (await driver.findElement(By.xpath(`//p[contains(.,"${mc1Name}")]`)).isDisplayed()).should.equal(true);

      // Try to create 2nd managed config
      await accessCreateArtifactView('documents.createManagedConfig', 'documents/list/managedconfigs');
      await driver.findElement(By.id('name')).sendKeys(mc2Name);
      await driver.findElement(By.css('[title="Labels"]')).click();
      await driver.findElement(By.css('[ng-class="classesBtn"]')).click();
      await driver.findElement(By.xpath(`//a[contains(.,"${labelDuplicateMCTest}")]`)).click();
      await driver.findElement(By.css('[class="label label-primary ng-binding ng-scope"]'));
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, mc2Content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);

      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);

      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Document creation error")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"Document creation error")]')).isDisplayed()).should.equal(true);
      var searchValue = `//div[contains(.,"No duplicate managed configs allowed. '${mc1Name}' already exists with schema_id")]`;
      (await driver.findElement(By.xpath(searchValue)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//div[contains(.,"and label(s): '${labelDuplicateMCTest}'.")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST3, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_manage_config_before_all');
      }
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
    });
  });

  describe('Create ENM SED Document @jenkins', function () {
    this.timeout(150000);
    this.retries(MAX_RETRIES);
    var schemaVersion = '0.0.4';
    var scheSIENMv1526 = '1.52.6';
    var scheSIENMv1603 = '1.60.3';
    var label5K = '5K';
    var labelECN = 'ECN';
    var labelMultInst = 'Feature_Test_Multi_Instance';
    var labelTranOnly = 'Small_Integrated_ENM_Transport_Only';
    var labelOTranOnly = 'Optimized_Small_Integrated_ENM_Transport_Only';
    var labelENMMTech = 'Small_Integrated_ENM_Multi_Technology';
    var buttonElement = '[ui-sref="documents.createEnmSed"]';
    beforeSuccessful = false;
    before(async function () {
      // Create Schemas
      await createSchemaREST(enmSchemaName, schemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);
      await createSchemaREST(enmSchemaName, scheSIENMv1526, enmSedSchemaSmallIntegrated1526, 'schemaREST2');
      await driver.sleep(1500);
      await createSchemaREST(enmSchemaName, scheSIENMv1603, enmSedSchemaSmallIntegrated1603, 'schemaREST3');
      await driver.sleep(1500);

      // Create Labels
      await createLabelREST(label5K, 'size', 'labelREST1');
      await createLabelREST(labelECN, 'site', 'labelREST2');
      await createLabelREST(labelMultInst, 'size', 'labelREST3');
      await createLabelREST(labelTranOnly, 'size', 'labelREST4');
      await createLabelREST(labelENMMTech, 'size', 'labelREST5');
      await createLabelREST(labelOTranOnly, 'size', 'labelREST6');
      await driver.sleep(1500);

      // Create Managed Configs
      await createManagedConfigREST(`${label5K}_${schemaVersion}`, schemaREST1._id, label5K, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);
      await createManagedConfigREST(`${labelECN}_${schemaVersion}`, schemaREST1._id, labelECN, managedConfigEcn, 'managedConfigREST2');
      await driver.sleep(1500);
      await createManagedConfigREST(`${labelMultInst}_${scheSIENMv1526}`, schemaREST2._id, labelMultInst, managedConfigFTMI, 'managedConfigREST3');
      await driver.sleep(1500);
      await createManagedConfigREST(`${labelECN}_${scheSIENMv1603}`, schemaREST3._id, labelECN, managedConfigEcn1603, 'managedConfigREST4');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should check that document options are displaying correctly', async function () {
      var enmSedName = 'EnmSedDocument_DO';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Document Options")]')), 30000);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      // useexternalnfs
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isSelected()).should.equal(true);
      // autopopulate
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isSelected()).should.equal(false);
      // vio
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.vio"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isSelected()).should.equal(true);
      // vioMultiTech, vioTransportOnly & vioOptimizedTransportOnly
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isDisplayed()).should.equal(false);
      // overcommit
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isEnabled()).should.equal(false);
      // dns
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.dns"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isSelected()).should.equal(false);
      // ipv6
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isEnabled()).should.equal(false);
    });

    it('should check that document options are displaying correctly with small integrated schema', async function () {
      var enmSedName = 'EnmSedDocument_DO';
      var schemaName = `${enmSchemaName}-${scheSIENMv1526}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Document Options")]')), 30000);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      // useexternalnfs
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isSelected()).should.equal(true);
      // autopopulate
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isSelected()).should.equal(false);
      // vio
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isDisplayed()).should.equal(false);
      // vioMultiTech
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isEnabled()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isSelected()).should.equal(true);
      // vioTransportOnly
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isEnabled()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isSelected()).should.equal(true);
      // vioOptimizedTransportOnly
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isEnabled()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isSelected()).should.equal(true);
      // overcommit
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isEnabled()).should.equal(false);
      // dns
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.dns"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isSelected()).should.equal(false);
      // ipv6
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isEnabled()).should.equal(false);
    });

    it('should check that document options overcommit flavours is enabled with correct managed config', async function () {
      var enmSedName = 'EnmSedDocument_DO';
      var schemaName = `${enmSchemaName}-${scheSIENMv1526}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Document Options")]')), 30000);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isEnabled()).should.equal(false);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'Feature_Test_Multi_Instance', 'css');
      await driver.sleep(200);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isSelected()).should.equal(true);
    });

    it('should show invalid json error', async function () {
      var content = 'invalid_json';
      var enmSedName = 'Testing_json_check';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      await driver.findElement(By.id('document_json')).sendKeys(content);
      (await driver.findElement(By.xpath('//p[contains(.,"This should be valid JSON")]')).isDisplayed()).should.equal(true);
    });

    it('should fix the parent key in paste mode for an ENM sed document, when user enters invalid parent key', async function () {
      var content = String(enmSedDocument).replace('"parameters":', '"parameter_defaults":');
      var enmSedName = 'EnmSedDocument_Json_PM_check';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Document JSON was invalid');
      await driver.switchTo().alert().accept();
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false);
    });

    it('should keep document content when switching between on and off pasteMode', async function () {
      var content = String(enmSedDocument);
      var enmSedName = 'EnmSedDocument_PasteMode_Check';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      (await driver.findElement(By.id('form-parameters-deployment_id')).getAttribute('value')).should.equal('testDeployment');
      (await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).getAttribute('value')).should.equal('10.10.0.5');
      (await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).getAttribute('value')).should.equal('10.10.0.49');
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.deployment_id).should.equal('testDeployment');
      (jsonContent.parameters.dynamic_ip_range_start).should.equal('10.10.0.5');
      (jsonContent.parameters.dynamic_ip_range_end).should.equal('10.10.0.49');
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false);
    });

    it('should remove empty key values from json in paste mode and still inform what keys are required', async function () {
      var content = String(enmSedDocumentEmptyValues);
      (await jsonHasEmptyValue(JSON.parse(content))).should.equal(true);
      var enmSedName = 'ENMSED_remove_empty_json_key_values';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"Required")]')).isDisplayed()).should.equal(true);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      (await jsonHasEmptyValue(JSON.parse(jsonContent))).should.equal(false);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('testDeployment');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false, false);
    });

    it('should remove empty key values from yaml in paste mode and still inform what keys are required', async function () {
      var content = String(enmSedDocumentEmptyValuesYaml);
      var enmSedName = 'ENMSED_remove_empty_yaml_key_values';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_yaml')), 30000);
      await driver.findElement(By.id('document_yaml')).click();
      await driver.findElement(By.id('document_yaml')).clear();
      var element = await driver.findElement(By.id('document_yaml'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_yaml')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"Required")]')).isDisplayed()).should.equal(true);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_yaml')), 30000);
      await driver.findElement(By.id('document_yaml')).click();
      await driver.findElement(By.id('document_yaml')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('testDeployment');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.flavor_accesscontrol).should.equal('flavor_1vC4M');
      (jsonContent.parameters.ntp_external_servers).should.equal('159.107.173.3,159.107.173.12');
      (jsonContent.parameters.vm_name_sentinel).should.equal('sentinel-ieatenmc3a04');
      await deleteArtifactREST('documents', false, enmSedName, false, false, false);
    });

    it('should not be allowed select same managed config twice', async function () {
      var enmSedName = 'EnmSedDocument_MC_Selection';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', '5K', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs1-mc')), 30000);
      await driver.findElement(By.id('category[1]')).click();
      await driver.findElement(By.id('category[1]')).sendKeys(`site${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs1-mc', 'ECN', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs2-mc')), 30000);
      await select2Field('managedconfigs2-mc', 'ECN', 'css');
      (await driver.findElement(By.xpath('//li[contains(.,"No results found")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//p[contains(.,"This field is required")]')).isDisplayed()).should.equal(true);
      await driver.findElement(By.id('delete_managedconfigs[2]')).click();
      await driver.switchTo().alert().accept();
      await driver.sleep(80);
      var found = await driver.findElement(By.xpath('//p[contains(.,"This field is required")]')).then(function () {
        return true;
      }, function (err) {
        if (err instanceof webdriver.error.NoSuchElementError) {
          return false;
        }
      });
      found.should.equal(false);
    });

    it('should create ENM sed document with managed configs and see it in ENM sed documents list', async function () {
      var enmSedName = 'EnmSedDocument_MC';
      var schemaName = `${enmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', '5K', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs1-mc')), 30000);
      await driver.findElement(By.id('category[1]')).click();
      await driver.findElement(By.id('category[1]')).sendKeys(`site${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs1-mc', 'ECN', 'css');
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('testDeployment');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).sendKeys('10.10.0.5');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).sendKeys('10.10.0.49');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0005');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0031');
      await driver.findElement(By.id('form-parameters-host_system_identifier')).click();
      await driver.findElement(By.id('form-parameters-host_system_identifier')).sendKeys('enmHost');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//a[contains(.,"5K")]')).getText()).should.containEql('5K');
      (await driver.findElement(By.xpath('//a[contains(.,"ECN")]')).getText()).should.containEql('ECN');
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      (await driver.findElement(By.id('category[0]')).getAttribute('value')).should.equal('size');
      (await driver.findElement(By.id('managedconfigs0-mc')).getText()).should.containEql('5K');
      (await driver.findElement(By.id('category[1]')).getAttribute('value')).should.equal('site');
      (await driver.findElement(By.id('managedconfigs1-mc')).getText()).should.containEql('ECN');
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await driver.wait(until.elementLocated(By.css(buttonElement)), 30000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false, false);
    });

    it('should create ENM sed document then check that the vim_tenant_name and vim_name are auto populated with temporary values', async function () {
      var enmSedName = 'ENM_Auto_Populate';
      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);
      await accessArtifactView('documents', enmDocumentREST1);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.vim_tenant_name).should.equal('temporary');
      (jsonContent.parameters.vim_name).should.equal('temporary');
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
    });

    it('should create ENM sed document with sienm transport_only managed config', async function () {
      var enmSedName = 'EnmSedDocument_sienm_transport_only';
      var schemaName = `${enmSchemaName}-${scheSIENMv1526}`;
      // ECN
      await createManagedConfigREST(`${labelECN}_${scheSIENMv1526}`, schemaREST2._id, labelECN, managedConfigEcn1526, 'managedConfigREST5');
      await driver.sleep(1500);
      // Small_Integrated_ENM_Transport_Only
      await createManagedConfigREST(`${labelTranOnly}_${scheSIENMv1526}`, schemaREST2._id, labelTranOnly, managedConfigSIEMTO1526, 'managedConfigREST6');
      await driver.sleep(1500);
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`site${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'ECN', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs1-mc')), 30000);
      await driver.findElement(By.id('category[1]')).click();
      await driver.findElement(By.id('category[1]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs1-mc', 'Small_Integrated_ENM_Transport_Only', 'css');
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isSelected()).should.equal(true);
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('deploymentSIENM');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).sendKeys('10.10.0.60');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).sendKeys('10.10.0.100');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0060');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0100');
      await driver.findElement(By.id('form-parameters-host_system_identifier')).click();
      await driver.findElement(By.id('form-parameters-host_system_identifier')).sendKeys('enmHost1');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//a[contains(.,"Small_Integrated_ENM")]')).getText()).should.containEql('Small_Integrated_ENM_Transport_Only');
      (await driver.findElement(By.xpath('//a[contains(.,"ECN")]')).getText()).should.containEql('ECN');
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      (await driver.findElement(By.id('category[0]')).getAttribute('value')).should.equal('site');
      (await driver.findElement(By.id('managedconfigs0-mc')).getText()).should.containEql('ECN');
      (await driver.findElement(By.id('category[1]')).getAttribute('value')).should.equal('size');
      (await driver.findElement(By.id('managedconfigs1-mc')).getText()).should.containEql('Small_Integrated_ENM_Transport_Only');
      await deleteArtifactREST('documents', false, enmSedName, false, false);
      await deleteArtifactREST('documents', managedConfigREST5, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST6, false, false, false);
    });

    it('should create ENM sed document with sienm transport_only managed config with enm_deployment_type', async function () {
      var enmSedName = 'SIENM_transport_only';
      var schemaName = `${enmSchemaName}-${scheSIENMv1603}`;
      // Small_Integrated_ENM_Transport_Only
      await createManagedConfigREST(`${labelTranOnly}_${scheSIENMv1603}`, schemaREST3._id, labelTranOnly, managedConfigSIEMTO1603, 'managedConfigREST7');
      await driver.sleep(1500);
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`site${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'ECN', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs1-mc')), 30000);
      await driver.findElement(By.id('category[1]')).click();
      await driver.findElement(By.id('category[1]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs1-mc', 'Small_Integrated_ENM_Transport_Only', 'css');
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isSelected()).should.equal(true);
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('SIENMdeploy');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).sendKeys('10.10.0.101');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).sendKeys('10.10.0.150');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0101');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0150');
      await driver.findElement(By.id('form-parameters-host_system_identifier')).click();
      await driver.findElement(By.id('form-parameters-host_system_identifier')).sendKeys('enmHost2');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//td[contains(.,"SIENM_transport_only")]')).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false);
      await deleteArtifactREST('documents', managedConfigREST7, false, false, false);
    });

    it('should create ENM sed document with sienm multi_technology managed config with enm_deployment_type', async function () {
      var enmSedName = 'SIENM_multi_technology';
      var schemaName = `${enmSchemaName}-${scheSIENMv1603}`;
      // Small_Integrated_ENM_Multi_Technology
      await createManagedConfigREST(`${labelENMMTech}_${scheSIENMv1603}`, schemaREST3._id, labelENMMTech, managedConfigSIEMTO1603, 'managedConfigREST8');
      await driver.sleep(1500);
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`site${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'ECN', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs1-mc')), 30000);
      await driver.findElement(By.id('category[1]')).click();
      await driver.findElement(By.id('category[1]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs1-mc', 'Small_Integrated_ENM_Multi_Technology', 'css');
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isSelected()).should.equal(true);
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('SIENMMTdeploy');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).sendKeys('10.10.0.151');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).sendKeys('10.10.0.200');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0151');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0200');
      await driver.findElement(By.id('form-parameters-host_system_identifier')).click();
      await driver.findElement(By.id('form-parameters-host_system_identifier')).sendKeys('enmHost3');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//td[contains(.,"SIENM_multi_technology")]')).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false);
      await deleteArtifactREST('documents', managedConfigREST8, false, false, false);
    });

    it('should create ENM sed document with osienm_transport_only managed config with enm_deployment_type', async function () {
      var enmSedName = 'OSIENM_transport_only';
      var schemaName = `${enmSchemaName}-${scheSIENMv1603}`;
      // Optimized_Small_Integrated_ENM_Transport_Only
      await createManagedConfigREST(`${labelOTranOnly}_${scheSIENMv1603}`, schemaREST3._id, labelOTranOnly, managedConfigOSIEMTO1603, 'managedConfigREST9');
      await driver.sleep(1500);
      await accessCreateArtifactView('documents.createEnmSed', 'documents/list/enm_sed');
      await driver.findElement(By.id('name')).sendKeys(enmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`site${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'ECN', 'css');
      await driver.findElement(By.id('add-managedconfig')).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs1-mc')), 30000);
      await driver.findElement(By.id('category[1]')).click();
      await driver.findElement(By.id('category[1]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs1-mc', 'Optimized_Small_Integrated_ENM_Transport_Only', 'css');
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.vioOptimizedTransportOnly"]')).isSelected()).should.equal(true);
      await driver.findElement(By.id('form-parameters-deployment_id')).click();
      await driver.findElement(By.id('form-parameters-deployment_id')).sendKeys('OSIENMdeploy');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_start')).sendKeys('10.10.0.101');
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ip_range_end')).sendKeys('10.10.0.150');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_start')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0101');
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).click();
      await driver.findElement(By.id('form-parameters-dynamic_ipv6_range_end')).sendKeys('fd5b:1fd5:8295:5339:0000:0000:0000:0150');
      await driver.findElement(By.id('form-parameters-host_system_identifier')).click();
      await driver.findElement(By.id('form-parameters-host_system_identifier')).sendKeys('enmHost2');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//td[contains(.,"OSIENM_transport_only")]')).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, enmSedName, false, false);
      await deleteArtifactREST('documents', managedConfigREST9, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_enm_sed_document_before_all');
      }
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST2, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST3, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST4, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST2, false, false, false);
      await deleteArtifactREST('labels', labelREST3, false, false, false);
      await deleteArtifactREST('labels', labelREST4, false, false, false);
      await deleteArtifactREST('labels', labelREST5, false, false, false);
      await deleteArtifactREST('labels', labelREST6, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
    });
  });

  describe('Create cENM SED Document', function () {
    this.timeout(150000);
    this.retries(MAX_RETRIES);

    beforeSuccessful = false;
    before(async function () {
      // Create Schema
      await createSchemaREST('cenm_site_values', '1.1.1', cENMSiteValuesSchema, 'schemaREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should create cENM sed document', async function () {
      await newDocumentPMsetup('cENM_site_doc_test', 'cenm_site_values-1.1.1', cENMSiteValuesDoc, 'createcEnmSed', 'cenm_sed');
      await driver.get(`${baseUrl}documents/list/cenm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createcEnmSed"]')), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"cENM_site_doc_test")]')).isDisplayed()).should.equal(true);
    });

    it('should create cENM sed document with managed configs and see it in cENM sed documents list', async function () {
      // Label
      await createLabelREST('cENM_Label', 'size', 'labelREST1');
      await driver.sleep(1500);
      // Managed Config
      await createManagedConfigREST('cENM_MC', schemaREST1._id, 'cENM_Label', cENMSiteValuesMC, 'managedConfigREST1');

      var cEnmSedName = 'cENM_site_doc';
      var schemaName = `${schemaREST1.name}-${schemaREST1.version}`;
      await accessCreateArtifactView('documents.createcEnmSed', 'documents/list/cenm_sed');
      await driver.findElement(By.id('name')).sendKeys(cEnmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'cENM_MC', 'css');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      await takeScreenshot('4');
      (await driver.findElement(By.xpath(`//p[contains(.,"${cEnmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//a[contains(.,"cENM_MC")]')).getText()).should.containEql('cENM_MC');
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      (await driver.findElement(By.id('category[0]')).getAttribute('value')).should.equal('size');
      (await driver.findElement(By.id('managedconfigs0-mc')).getText()).should.containEql('cENM_MC');
      await driver.get(`${baseUrl}documents/list/cenm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createcEnmSed"]')), 30000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${cEnmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, cEnmSedName, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_enm_sed_document_before_all');
      }
      await deleteItem('documents.createcEnmSed', 'cENM_site_doc_test', 'cENM_site_doc_test', 'documents/list/cenm_sed', true);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
    });
  });

  describe('Create VNFLCM SED Document @jenkins', function () {
    this.timeout(30000);
    this.retries(MAX_RETRIES);
    var vnflcmSchemaName = 'vnflcm_sed_schema';
    var schemaVersion = '1.0.2';
    beforeSuccessful = false;
    before(async function () {
      await createSchemaREST(vnflcmSchemaName, schemaVersion, vnflcmSchema, 'schemaREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should check that document options are displaying correctly', async function () {
      var vnflcmSedName = 'VNFLCM_DOC_DO';
      var schemaName = `${vnflcmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createVnfLcmSed', 'documents/list/vnflcm_sed');
      await driver.findElement(By.id('name')).sendKeys(vnflcmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Document Options")]')), 30000);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isDisplayed()).should.equal(false);
      // autopopulate
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isSelected()).should.equal(false);
      // HA
      (await driver.findElement(By.css('[ng-model="vm.document.ha"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ha"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ha"]')).isSelected()).should.equal(false);
      await driver.findElement(By.css('[ng-model="vm.document.ha"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.ha"]')).isSelected()).should.equal(true);
    });

    it('should show invalid json error', async function () {
      var content = 'invalid_json';
      var vnflcmSedName = 'Testing_json_check';
      var schemaName = `${vnflcmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createVnfLcmSed', 'documents/list/vnflcm_sed');
      await driver.findElement(By.id('name')).sendKeys(vnflcmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      await driver.findElement(By.id('document_json')).sendKeys(content);
      (await driver.findElement(By.xpath('//p[contains(.,"This should be valid JSON")]')).isDisplayed()).should.equal(true);
    });

    it('should fix the parent key in paste mode for a VNFLCM sed document, when user enters invalid parent key', async function () {
      var content = String(vnflcmDocument).replace('"parameters":', '"parameter_defaults":');
      var vnflcmSedName = 'VNFLCM_Json_PM_check';
      var schemaName = `${vnflcmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createVnfLcmSed', 'documents/list/vnflcm_sed');
      await driver.findElement(By.id('name')).sendKeys(vnflcmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Document JSON was invalid');
      await driver.switchTo().alert().accept();
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${vnflcmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, 'VNFLCM_Json_PM_check', false, false);
    });

    it('should remove empty key values from json in paste mode and still inform what keys are required', async function () {
      var content = String(vnflcmDocumentEmptyValues);
      (await jsonHasEmptyValue(JSON.parse(content))).should.equal(true);
      var vnflcmSedName = 'VNFLCMSED_remove_empty_json_key_values';
      var schemaName = `${vnflcmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createVnfLcmSed', 'documents/list/vnflcm_sed');
      await driver.findElement(By.id('name')).sendKeys(vnflcmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).clear();
      var element = await driver.findElement(By.id('document_json'));
      await driver.executeScript('arguments[0].value=arguments[1]', element, content);
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"Required")]')).isDisplayed()).should.equal(true);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      (await jsonHasEmptyValue(JSON.parse(jsonContent))).should.equal(false);
      await driver.findElement(By.id('document_json')).click();
      await driver.findElement(By.id('document_json')).sendKeys(webdriver.Key.ENTER);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Save")]')), 30000);
      await driver.findElement(By.id('form-parameters-ntp_servers')).click();
      await driver.findElement(By.id('form-parameters-ntp_servers')).sendKeys('159.107.173.3,159.107.173.12');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${vnflcmSedName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('documents', false, 'VNFLCMSED_remove_empty_json_key_values', false, false);
    });

    it('should create VNFLCM sed document then check the auto populate temporary values are correct', async function () {
      var vnflcmSedName = 'VNFLCM_Auto_Populate';
      var schemaName = `${vnflcmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createVnfLcmSed', 'documents/list/vnflcm_sed');
      await driver.findElement(By.id('name')).sendKeys(vnflcmSedName);
      await select2Field('schema', schemaName);
      await driver.sleep(2000);
      await driver.findElement(By.id('form-parameters-ntp_servers')).click();
      await driver.findElement(By.id('form-parameters-ntp_servers')).sendKeys('159.107.173.3,159.107.173.12');
      await driver.findElement(By.id('form-parameters-vnflafdb_volume_size')).click();
      await driver.findElement(By.id('form-parameters-vnflafdb_volume_size')).sendKeys('120');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${vnflcmSedName}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.deployment_id).should.equal('temporary');
      (jsonContent.parameters.dns_server_ip).should.equal('1.1.1.1,1.1.1.1');
      (jsonContent.parameters.ip_version).should.equal('4');
      (jsonContent.parameters.internal_ipv4_subnet_cidr).should.equal('1.1.1.1/1');
      (jsonContent.parameters.internal_ipv6_subnet_cidr).should.equal('::/64');
      (jsonContent.parameters.external_ipv6_subnet_cidr).should.equal('::/64');
      (jsonContent.parameters.internal_ipv6_vip_for_services).should.equal('::');
      (jsonContent.parameters.external_ipv6_for_services_vm).should.equal('::');
      (jsonContent.parameters.vim_HostName).should.equal('temporary');
      (jsonContent.parameters.vim_tenant_name).should.equal('temporary');
      (jsonContent.parameters.vim_tenant_id).should.equal('1');
      (jsonContent.parameters.vim_url).should.equal('http://temporary.com');
      (jsonContent.parameters.services_vm_count).should.equal('1');
      (jsonContent.parameters.db_vm_count).should.equal('1');
      await deleteArtifactREST('documents', false, 'VNFLCM_Auto_Populate', false, false);
    });

    it('should create VNFLCM sed document and check the auto populate temporary values with HA enabled are correct', async function () {
      var vnflcmSedName = 'VNFLCM_Auto_Populate_HA';
      var schemaName = `${vnflcmSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createVnfLcmSed', 'documents/list/vnflcm_sed');
      await driver.findElement(By.id('name')).sendKeys(vnflcmSedName);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Document Options")]')), 30000);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      await driver.findElement(By.css('[ng-model="vm.document.ha"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.ha"]')).isSelected()).should.equal(true);
      await driver.findElement(By.id('form-parameters-ntp_servers')).click();
      await driver.findElement(By.id('form-parameters-ntp_servers')).sendKeys('159.107.173.3,159.107.173.12');
      await driver.findElement(By.id('form-parameters-vnflafdb_volume_size')).click();
      await driver.findElement(By.id('form-parameters-vnflafdb_volume_size')).sendKeys('120');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//p[contains(.,"${vnflcmSedName}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.deployment_id).should.equal('temporary');
      (jsonContent.parameters.dns_server_ip).should.equal('1.1.1.1,1.1.1.1');
      (jsonContent.parameters.ip_version).should.equal('4');
      (jsonContent.parameters.services_vm_count).should.equal('2');
      (jsonContent.parameters.db_vm_count).should.equal('2');
      (jsonContent.parameters.db_internal_vrrp_id).should.equal('3');
      (jsonContent.parameters.svc_internal_vrrp_id).should.equal('2');
      (jsonContent.parameters.svc_external_vrrp_id).should.equal('1');
      (jsonContent.parameters.availability_rule).should.equal('anti-affinity');
      await deleteArtifactREST('documents', false, 'VNFLCM_Auto_Populate_HA', false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_vnf_lcm_sed_document_before_all');
      }
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
    });
  });

  describe('Create Other Document @jenkins', function () {
    this.timeout(30000);
    this.retries(MAX_RETRIES);
    var otherSchemaName = 'do_automation';
    var schemaVersion = '2.0.2';
    beforeSuccessful = false;
    before(async function () {
      await createSchemaREST(otherSchemaName, schemaVersion, doSchema, 'schemaREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should not display document options for other document', async function () {
      var otherDocName = 'DO_ECM_NDO';
      var schemaName = `${otherSchemaName}-${schemaVersion}`;
      await accessCreateArtifactView('documents.createOther', 'documents/list/other');
      await driver.findElement(By.id('name')).sendKeys(otherDocName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      (await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).isDisplayed()).should.equal(false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_other_document_before_all');
      }
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
    });
  });

  describe('Create Pod @jenkins', function () {
    this.timeout(80000);
    this.retries(MAX_RETRIES);
    var buttonElement = 'pods.create';

    it('should not allow to remove all networks', async function () {
      await accessCreateArtifactView('pods.create', 'pods');
      (await driver.findElement(By.id('networks[0].remove')).isEnabled()).should.equal(false);
      await driver.findElement(By.id('networks[0].name')).sendKeys('network1');
      await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('100');
      await driver.findElement(By.id('networks[0].vrrp_range.end')).sendKeys('255');
      await driver.findElement(By.id('networks[0].ipv4_subnet.cidr')).sendKeys('10.150.241.0/24');
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys('10.150.241.1');
      (await driver.findElement(By.id('networks[0].remove')).isEnabled()).should.equal(false);
    });

    it('should allow to remove the first network when more networks are added', async function () {
      var networkName = 'network2';
      await accessCreateArtifactView('pods.create', 'pods');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Add Network")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('networks[1].name')), 30000);
      await driver.findElement(By.id('networks[1].name')).sendKeys(networkName);
      (await driver.findElement(By.id('networks[0].remove')).isEnabled()).should.equal(true);
      (await driver.findElement(By.id('networks[1].remove')).isEnabled()).should.equal(true);
      element = await driver.findElement(By.id('networks[0].remove'));
      await driver.executeScript('arguments[0].click()', element);
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to delete this network?');
      await driver.switchTo().alert().accept();
      await driver.sleep(200);
      (await driver.findElement(By.id('networks[0].name')).getAttribute('value')).should.equal(networkName);
    });

    it('should create a Pod with no ipv6 subnet', async function () {
      var podName = 'NewIPv6Pod';
      await accessCreateArtifactView('pods.create', 'pods');
      await driver.findElement(By.id('name')).sendKeys(podName);
      await driver.findElement(By.id('authUrl')).sendKeys('https://newpod2.com');
      await driver.findElement(By.id('networks[0].name')).sendKeys('network1');
      await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('100');
      await driver.findElement(By.id('networks[0].vrrp_range.end')).sendKeys('255');
      await driver.findElement(By.id('networks[0].ipv4_subnet.cidr')).sendKeys('10.150.241.0/24');
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys('10.150.241.1');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('pods', false, podName, false, false);
    });

    it('should allow ipv6 subnets to be removed from Pod', async function () {
      var podName = 'AnIpv6lessPod';
      await accessCreateArtifactView('pods.create', 'pods');
      await driver.findElement(By.id('name')).sendKeys(podName);
      await driver.findElement(By.id('authUrl')).sendKeys('https://newpod3.com');
      await driver.findElement(By.id('networks[0].name')).sendKeys('network1');
      await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('100');
      await driver.findElement(By.id('networks[0].vrrp_range.end')).sendKeys('255');
      await driver.findElement(By.id('networks[0].ipv4_subnet.cidr')).sendKeys('131.160.205.0/24');
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys('131.160.205.1');
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add IPv6 Subnet")]')), 30000);
      var element = await driver.findElement(By.xpath('//button[contains(.,"Add IPv6 Subnet")]'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath('//button[contains(.,"Save")]')).isEnabled()).should.equal(false);
      await driver.findElement(By.id('networks[0].ipv6_subnet.cidr')).sendKeys('2001:1b70:6207:2a::/64');
      await driver.findElement(By.id('networks[0].ipv6_subnet.gateway_ip')).sendKeys('2001:1b70:6207:2a:0:870:0:1');
      (await driver.findElement(By.xpath('//button[contains(.,"Save")]')).isEnabled()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Remove IPv6 Subnet")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Remove IPv6 Subnet")]'));
      await driver.executeScript('arguments[0].click()', element);
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to delete this IPv6 Subnet?');
      await driver.switchTo().alert().accept();
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('pods', false, podName, false, false);
    });

    it('should not allow to remove a Pod network if a project is dependent on it', async function () {
      var podName = 'projectDependentPod';
      await accessCreateArtifactView('pods.create', 'pods');
      await driver.findElement(By.id('name')).sendKeys(podName);
      await driver.findElement(By.id('authUrl')).sendKeys('https://newpod4.com');
      await driver.findElement(By.id('networks[0].name')).sendKeys('network1');
      await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('100');
      await driver.findElement(By.id('networks[0].vrrp_range.end')).sendKeys('255');
      await driver.findElement(By.id('networks[0].ipv4_subnet.cidr')).sendKeys('10.150.241.0/24');
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys('10.150.241.1');
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Add IPv6 Subnet")]')), 30000);
      var element = await driver.findElement(By.xpath('//button[contains(.,"Add IPv6 Subnet")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.id('networks[0].ipv6_subnet.cidr')).sendKeys('2001:1b70:6207:2a::/64');
      await driver.findElement(By.id('networks[0].ipv6_subnet.gateway_ip')).sendKeys('2001:1b70:6207:2a:0:879:0:1');
      element = await driver.findElement(By.xpath('//button[contains(.,"Add Network")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('networks[1].name')), 30000);
      await driver.findElement(By.id('networks[1].name')).sendKeys('net2');
      await driver.findElement(By.id('networks[1].vrrp_range.start')).sendKeys('100');
      await driver.findElement(By.id('networks[1].vrrp_range.end')).sendKeys('255');
      await driver.findElement(By.id('networks[1].ipv4_subnet.cidr')).sendKeys('10.150.241.0/24');
      await driver.findElement(By.id('networks[1].ipv4_subnet.gateway_ip')).sendKeys('10.150.241.1');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);

      await newProjectSetup(projectName, podName);
      await accessEditArtifactView('pods.create', 'pods', podName);
      await driver.wait(until.elementLocated(By.id('networks[0].name')), 30000);
      (await driver.findElement(By.id('networks[0].remove')).isEnabled()).should.equal(false);
      (await driver.findElement(By.id('networks[1].remove')).isEnabled()).should.equal(true);
      await deleteArtifactREST('projects', false, projectName, false, false);
      await deleteArtifactREST('pods', false, podName, false, false);
    });

    it('should display Pod in list view table Created At and last Modified At fields', async function () {
      var podName = 'AnIpv6lessPod';
      var dateAndTime = new Date().toISOString().split('T');
      var createdAt = dateAndTime[0];
      var LastModifiedAt = dateAndTime[0];

      await accessCreateArtifactView('pods.create', 'pods');
      await driver.findElement(By.id('name')).sendKeys(podName);
      await driver.findElement(By.id('authUrl')).sendKeys('https://newpod3.com');
      await driver.findElement(By.id('networks[0].name')).sendKeys('network1');
      await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('100');
      await driver.findElement(By.id('networks[0].vrrp_range.end')).sendKeys('255');
      await driver.findElement(By.id('networks[0].ipv4_subnet.cidr')).sendKeys('131.160.205.0/24');
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys('131.160.205.1');

      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${createdAt}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${LastModifiedAt}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('pods', false, podName, false, false);
    });
  });

  describe('Create Project @jenkins', function () {
    this.timeout(80000);
    this.retries(MAX_RETRIES);
    beforeSuccessful = false;
    var newPodName = 'createPodProject';
    before(async function () {
      await createPodREST(newPodName, 'podREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should find start and end fields of ipv6 ranges to be hidden on creating a project', async function () {
      await accessCreateArtifactView('projects.create', 'projects');
      var found = await driver.findElements(By.id('network.ipv6_ranges[0].start'));
      found.length.should.equal(0);
      found = await driver.findElements(By.id('network.ipv6_ranges[0].end'));
      found.length.should.equal(0);
    });

    it('should find adding IPv6 Range button only enabled when pod network has ipv6 subnet, on creating a project', async function () {
      await accessCreateArtifactView('projects.create', 'projects');
      (await driver.findElement(By.id('ipv6RangeBtn')).isEnabled()).should.equal(false);
      await driver.wait(until.elementLocated(By.id('pod-select')), 30000);
      await select2Field('pod-select', newPodName);
      await select2Field('network-select', 'network1');
      (await driver.findElement(By.id('ipv6RangeBtn')).isEnabled()).should.equal(true);
      var element = await driver.findElement(By.id('ipv6RangeBtn'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('network.ipv6_ranges[0].start')), 30000);
      (await driver.findElement(By.id('network.ipv6_ranges[0].start')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.id('network.ipv6_ranges[0].end')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.id('ipv6RangeStartMsg')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.id('ipv6RangeEndMsg')).isDisplayed()).should.equal(true);
    });

    it('should display table columns: Created By, Created At and Last Modified At, in projects list', async function () {
      var dateAndTime = new Date().toISOString().split('T');
      var createdAt = dateAndTime[0];
      var lastModifiedAt = dateAndTime[0];
      var newProjectName = 'createProject';
      // Create
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.172', '2001:1b70:6207:2a:0000:0000:0000:0051', '2001:1b70:6207:2a:0000:0000:0000:0052', 'projectREST1');
      await driver.sleep(500);
      // Check
      await driver.get(`${baseUrl}projects`);
      await driver.sleep(1500);
      (await driver.findElement(By.xpath('//th[contains(.,"Created By")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//td[contains(.,"DITTEST")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//th[contains(.,"Created At")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${createdAt}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//th[contains(.,"Last Modified At")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${lastModifiedAt}")]`)).isDisplayed()).should.equal(true);
      // Delete
      await deleteArtifactREST('projects', projectREST1, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_pod_before_all');
      }
      await deleteArtifactREST('pods', podREST1, false, false, false);
    });
  });

  describe('Create Deployment @jenkins', function () {
    this.timeout(150000);
    this.retries(MAX_RETRIES);
    var enmSchemaVersion = '0.0.6';
    var buttonElement = 'deployments.create';
    beforeSuccessful = false;
    before(async function () {
      // create Pod
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should not create deployment when resave of SEDs fail', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.172', '2001:1b70:6207:2a:0000:0000:0000:0051', '2001:1b70:6207:2a:0000:0000:0000:0052', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocument, 'documentPMREST1');
      await driver.sleep(1500);

      await accessCreateArtifactView(buttonElement, 'deployments');
      await driver.findElement(By.id('name')).sendKeys(deploymentName);
      await select2Field('project-select', projectName);
      await select2Field('enm-sed-select', enmSedName);
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(500);
      (await driver.findElement(By.xpath('//h3[contains(.,"error!")]')).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 30000);
      (await driver.findElements(By.xpath(`//td[contains(.,"${deploymentName}")]`))).length.should.equal(0);
    });

    it('should create deployment with cenm sed and cenm deployment values document then see it in deployments list', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST('cenm_site_values', '2.2.2', cENMSiteValuesSchema, 'schemaREST1');
      await driver.sleep(1500);

      await createSchemaREST('cenm_deployment_values', '2.2.2', cENMDeploymentValues, 'schemaREST2');
      await driver.sleep(1500);

      await createDocumentPMREST('cENM_site_doc_test', schemaREST1._id, cENMSiteValuesDoc, 'enmDocumentREST1');
      await driver.sleep(1500);
      await createDocumentPMREST('cENM_deployment_values_doc_test', schemaREST2._id, cENMDeplymentValuesDoc, 'enmDocumentREST2');
      await driver.sleep(1500);

      await accessCreateArtifactView('deployments.create', 'deployments');
      await driver.findElement(By.id('name')).sendKeys('cENM_Depl_test');
      await select2Field('project-select', projectName);
      await driver.sleep(500);
      await driver.wait(until.elementLocated(By.name('sedType')), 5000);
      await driver.findElement(By.name('sedType')).click();
      await driver.sleep(1000);
      await select2Field('enm-sed-select', 'cENM_site_doc_test');
      await driver.wait(until.elementLocated(By.id('add-document')), 5000);
      await driver.findElement(By.id('add-document')).click();
      await driver.wait(until.elementLocated(By.id('select2-documents0-schema-container')), 5000);
      await select2Field('documents0-schema', 'cenm_deployment_values');
      await driver.sleep(500);
      await select2Field('documents0-document', 'cENM_deployment_values_doc_test');

      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);

      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"cENM_Depl_test")]')).isDisplayed()).should.equal(true);

      await deleteItem('deployments.create', 'cENM_Depl_test', 'cENM_Depl_test', 'deployments', true);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should display deployment in list view table Created At and last Modified At fields', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '1.54.4';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '1.0.20';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      var dateAndTime = new Date().toISOString().split('T');
      var createdAt = dateAndTime[0];
      var LastModifiedAt = dateAndTime[0];

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);

      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${createdAt}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${LastModifiedAt}")]`)).isDisplayed()).should.equal(true);
      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should create deployment with enm sed and vnflcm sed then see it in deployment list', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '1.54.4';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '1.0.20';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);

      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);

      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should create deployment with enm sed, vnflcm sed and associated document then see it in deployment list', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '1.54.99';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '1.0.99';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      var otherSchemaName = 'do_automation';
      var otherSchemaVersion = '2.0.2';
      await createSchemaREST(otherSchemaName, otherSchemaVersion, doSchema, 'schemaREST3');
      await driver.sleep(1500);

      var docName = 'Aotherdoc';
      await createDocumentPMREST(docName, schemaREST3._id, doDocument, 'doDocumentREST1');
      await driver.sleep(1500);

      await accessCreateArtifactView(buttonElement, 'deployments');
      await driver.findElement(By.id('name')).sendKeys(deploymentName);
      await select2Field('project-select', projectName);
      await select2Field('enm-sed-select', enmSedName);
      await driver.wait(until.elementLocated(By.id('select2-vnfLcm-sed-select-container')), 1000);
      await select2Field('vnfLcm-sed-select', vnflcmSedName);
      await driver.findElement(By.id('add-document')).click();
      await driver.wait(until.elementLocated(By.id('select2-documents1-schema-container')), 1000);
      await select2Field('documents1-schema', otherSchemaName);
      await driver.sleep(500);
      await select2Field('documents1-document', docName);
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      await driver.findElement(By.xpath(`//a[contains(.,${docName})]`));

      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);

      await deleteItem('deployments.create', deploymentName, deploymentName, 'deployments');
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', doDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
    });

    it('should create deployment with JIRA Issue', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '999.999.991';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '999.999.919';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await accessCreateArtifactView(buttonElement, 'deployments');
      await driver.findElement(By.id('name')).sendKeys('Anewdeployment');
      await select2Field('project-select', 'Anewproject');
      await select2Field('enm-sed-select', 'Anewsed');
      await driver.wait(until.elementLocated(By.id('select2-vnfLcm-sed-select-container')), 1000);
      await select2Field('vnfLcm-sed-select', 'Anewvnflcm');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[0]')).sendKeys('CIP-30065');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath('//td[contains(.,"CIP-30065")]')).isDisplayed()).should.equal(true);
      await deleteArtifactREST('deployments', false, deploymentName, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should edit a deployment and attach a JIRA Issue to it', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '999.999.991';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '999.999.919';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.get(`${baseUrl}deployments`);
      await driver.sleep(2000);
      await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('add-jira')), 5000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[0]')).sendKeys('CIP-30065');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath('//td[contains(.,"CIP-30065")]')).isDisplayed()).should.equal(true);
      await deleteArtifactREST('deployments', false, deploymentName, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should remove a JIRA Issue from a deployment', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '999.999.991';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '999.999.919';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);

      await driver.get(`${baseUrl}deployments`);
      await driver.sleep(1500);
      await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('add-jira')), 5000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[0]')).sendKeys('CIP-30065');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('add-jira')), 5000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Remove JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to remove this JIRA Issue 1: "CIP-30065"?');
      await driver.switchTo().alert().accept();
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath('//p[contains(.,"None")]')).getText()).should.equal('None');
      await deleteArtifactREST('deployments', false, deploymentName, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should not attach an invalid JIRA Issue to a deployment', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '999.999.991';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '999.999.919';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(2000);

      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.xpath(`//td[contains(.,"${deploymentName}")]`)), 8000);
      await driver.sleep(1500);
      await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('add-jira')), 5000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[0]')).sendKeys('CIP-NotReal');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Issue Does Not Exist")]')), 8000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Editing")]')), 8000);
      (await element.isEnabled()).should.equal(false);
      await deleteArtifactREST('deployments', false, deploymentName, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    it('should not attach a duplicate JIRA Issue to a deployment', async function () {
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '999.999.991';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '999.999.919';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);
      await driver.get(`${baseUrl}deployments`);
      await driver.sleep(1500);
      await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('add-jira')), 5000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[0]')).sendKeys('CIP-30065');
      await driver.findElement(By.tagName('body')).click();
      element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[1]')).sendKeys('CIP-30065');
      await driver.findElement(By.tagName('body')).click();
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.wait(until.elementLocated(By.xpath('//p[contains(.,"You cannot add the same JIRA Issue twice")]')), 8000);
      (await element.isEnabled()).should.equal(false);
      await deleteArtifactREST('deployments', false, deploymentName, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    afterEach(async function () {
      await deleteArtifactREST('projects', false, projectName, false, true);
      await deleteArtifactREST('documents', false, enmSedName, false, true);
      await deleteArtifactREST('schemas', false, enmSchemaName, false, true);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_deployment_before_all');
      }
      await deleteArtifactREST('pods', false, podName, false, false);
    });
  });

  describe('Create Group @jenkins', function () {
    this.timeout(50000);
    this.retries(MAX_RETRIES);
    var buttonElement = 'groups.create';
    var enmSchemaVersion = '0.0.7';
    beforeSuccessful = false;
    before(async function () {
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should create group with associated: document, pod, project, deployment and see in groups list', async function () {
      var name = 'adminsUsersAssociations';
      await accessCreateArtifactView(buttonElement, 'groups');
      await driver.wait(until.elementLocated(By.id('name')), 5000);
      var element = driver.findElement(By.id('name'));
      await element.click();
      await element.sendKeys(name);
      await driver.sleep(500);
      await driver.findElement(By.name('adminPrimary')).sendKeys('ecasjim');
      await driver.sleep(500);
      await driver.findElement(By.name('adminSecondary')).sendKeys('ejamfur');
      await driver.sleep(500);
      // users
      await driver.findElement(By.id('signum')).sendKeys('eavrbra');
      await driver.sleep(500);
      await driver.findElement(By.css('[ng-click="vm.addUser()"]')).click();
      await driver.findElement(By.xpath('//td[contains(.,"Avril Brady")]'));
      await driver.findElement(By.id('signum')).sendKeys('EZHICCO');
      await driver.findElement(By.css('[ng-click="vm.addUser()"]')).click();
      await driver.findElement(By.xpath('//td[contains(.,"Conor Hickey")]'));
      // document
      await driver.findElement(By.id('docName')).sendKeys(enmSedName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'document\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      // pod
      await driver.findElement(By.id('podName')).sendKeys(podName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'pod\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).isDisplayed()).should.equal(true);
      // project
      await driver.findElement(By.id('projectName')).sendKeys(projectName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'project\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${projectName}")]`)).isDisplayed()).should.equal(true);
      // deployment
      await driver.findElement(By.id('deploymentName')).sendKeys(deploymentName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'deployment\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath(`//h1[contains(.,"${name}")]`)), 30000);
      (await driver.findElement(By.xpath('//p[contains(.,"Jimmy Casey")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//p[contains(.,"James Furey")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//p[contains(.,"Avril Brady")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//p[contains(.,"Conor Hickey")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//a[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//a[contains(.,"${podName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//a[contains(.,"${projectName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//a[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}groups`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${name}")]`)).isDisplayed()).should.equal(true);
    });

    it('should create group with associated: document, pod, project, deployment and see a unique alert pop-up while trying to remove each of them', async function () {
      var name = 'adminsUsersAssociationDeletion';
      await accessCreateArtifactView(buttonElement, 'groups');
      await driver.wait(until.elementLocated(By.id('name')), 5000);
      var element = driver.findElement(By.id('name'));
      await element.click();
      await element.sendKeys(name);
      await driver.sleep(500);
      await driver.findElement(By.name('adminPrimary')).sendKeys('ecasjim');
      await driver.findElement(By.name('adminSecondary')).sendKeys('ejamfur');
      // user
      await driver.findElement(By.id('signum')).sendKeys('eavrbra');
      await driver.findElement(By.css('[ng-click="vm.addUser()"]')).click();
      await driver.findElement(By.xpath('//td[contains(.,"Avril Brady")]'));
      // document
      await driver.findElement(By.id('docName')).sendKeys(enmSedName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'document\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      await driver.findElement(By.css('[ng-click="vm.removeArtifact(\'document\', document)"]')).click();
      var alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to remove this document association?');
      await driver.switchTo().alert().dismiss();
      // pod
      await driver.findElement(By.id('podName')).sendKeys(podName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'pod\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).isDisplayed()).should.equal(true);
      await driver.findElement(By.css('[ng-click="vm.removeArtifact(\'pod\', pod)"]')).click();
      alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to remove this pod association?');
      await driver.switchTo().alert().dismiss();
      // project
      await driver.findElement(By.id('projectName')).sendKeys(projectName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'project\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${projectName}")]`)).isDisplayed()).should.equal(true);
      await driver.findElement(By.css('[ng-click="vm.removeArtifact(\'project\', project)"]')).click();
      alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to remove this project association?');
      await driver.switchTo().alert().dismiss();
      // deployment
      await driver.findElement(By.id('deploymentName')).sendKeys(deploymentName);
      await driver.findElement(By.css('[ng-click="vm.addArtifact(\'deployment\')"]')).click();
      (await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);
      await driver.findElement(By.css('[ng-click="vm.removeArtifact(\'deployment\', deployment)"]')).click();
      alert = await driver.switchTo().alert().getText();
      alert.should.containEql('Are you sure you want to remove this deployment association?');
      await driver.switchTo().alert().dismiss();

      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"creation successful!")]')).isDisplayed()).should.equal(true);
      await driver.get(`${baseUrl}groups`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${name}")]`)).isDisplayed()).should.equal(true);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_group_before_all');
      }
      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
    });
  });

  describe('Edit Deployment @jenkins', function () {
    this.timeout(150000);
    this.retries(MAX_RETRIES);
    var enmSchemaVersion = '0.0.6';
    var buttonElement = 'deployments.create';
    beforeSuccessful = false;
    before(async function () {
      // create Pod
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should edit deployment with enm sed and vnflcm sed to use cenm sed and see it list', async function () {
      // create deployment
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      enmSchemaVersion = '1.54.4';
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var vnflcmSchemaVersion = '1.0.20';
      var vnflcmSchemaName = 'vnflcm_sed_schema';
      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      var vnflcmSedName = 'Anewvnflcm';
      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);

      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      (await driver.findElement(By.xpath(`//td[contains(.,"${deploymentName}")]`)).isDisplayed()).should.equal(true);

      // Create cENM SED
      await createSchemaREST('cenm_site_values', '2.2.2', cENMSiteValuesSchema, 'schemaREST1');
      await driver.sleep(1500);
      await createDocumentPMREST('cENM_site_doc_test', schemaREST1._id, cENMSiteValuesDoc, 'enmDocumentREST1');
      await driver.sleep(1500);
      // Edit Deployment
      await accessEditArtifactView(buttonElement, 'deployments', deploymentName);
      await driver.wait(until.elementLocated(By.name('sedType')), 5000);
      await driver.findElement(By.name('sedType')).click();
      await driver.sleep(500);
      await select2DropdownSelect('enm-sed-select', 'cENM_site_doc_test');
      await driver.sleep(1000);
      // Save
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);

      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });


    afterEach(async function () {
      await deleteArtifactREST('projects', false, projectName, false, false);
      await deleteArtifactREST('documents', false, enmSedName, false, true);
      await deleteArtifactREST('schemas', false, enmSchemaName, false, true);
    });
    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('create_deployment_before_all');
      }
      await deleteArtifactREST('pods', false, podName, false, false);
    });
  });

  describe('Edit vENM SED Document @jenkins', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    var enmSchemaVersion = '0.0.8';
    var buttonElement = 'documents.createEnmSed';
    beforeSuccessful = false;
    before(async function () {
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);

      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1');
      await driver.sleep(1500);

      beforeSuccessful = true;
    });

    it('should edit ENM sed document then check that the vim_tenant_name and vim_name are auto populated with temporary values', async function () {
      await accessEditArtifactView(buttonElement, 'documents/list/enm_sed', enmSedName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.vim_tenant_name).should.equal(projectName);
      (jsonContent.parameters.vim_name).should.equal(`vim_${projectName}`);
    });

    it('should check that ipv6 document option is enabled after sed document is attached to a deployment with a project with ipv6 ranges', async function () {
      await accessEditArtifactView(buttonElement, 'documents/list/enm_sed', enmSedName);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.useexternalnfs"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vio"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.vioMultiTech"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.vioTransportOnly"]')).isDisplayed()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.overcommit"]')).isEnabled()).should.equal(false);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.dns"]')).isEnabled()).should.equal(true);
      // ipv6
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isEnabled()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isSelected()).should.equal(false);
    });

    it('should check the value of ip_version field when ipv6 document option is enabled after sed document is attached to a deployment with a project with ipv6 ranges', async function () {
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 30000);
      var linkLocation = await findItemInTable(enmSedName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('ip_version')), 30000);
      (await driver.findElement(By.id('ip_version')).getText()).should.equal('dual');
    });

    it('should check the value of ip_version field when ipv6 document option is disabled in a sed', async function () {
      await accessEditArtifactView(buttonElement, 'documents/list/enm_sed', enmSedName);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.autopopulate"]')).isEnabled()).should.equal(true);
      // ip_version check
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isSelected()).should.equal(false);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.id('ip_version')).getText()).should.equal('v4');
    });

    it('should check Float Save Button works as expected', async function () {
      await accessEditArtifactView(buttonElement, 'documents/list/enm_sed', enmSedName);
      element = await driver.findElement(By.className('glyphicon-floppy-save'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);
    });

    it('should check that ipv6 document option is still disabled after sed document is attached to a deployment with a project without ipv6 ranges', async function () {
      await accessEditArtifactView('projects.create', 'projects', projectName);
      await driver.wait(until.elementLocated(By.id('network.ipv6_ranges[0].start')), 30000);
      await driver.findElement(By.id('network.ipv6_ranges[0].start')).clear();
      await driver.findElement(By.id('network.ipv6_ranges[0].end')).clear();
      await driver.wait(until.elementLocated(By.id('removeBtn')), 30000);
      element = await driver.findElement(By.id('removeBtn'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.switchTo().alert().accept();
      await driver.sleep(500);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 12000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);
      await accessEditArtifactView(buttonElement, 'documents/list/enm_sed', enmSedName);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      // ipv6
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isDisplayed()).should.equal(true);
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isEnabled()).should.equal(false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('edit_enm_sed_document_before_all');
      }
      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
    });
  });

  describe('Edit cENM SED Document @jenkins', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    beforeSuccessful = false;
    before(async function () {
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);

      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      // ipv4 cENM schema
      await createSchemaREST('cenm_site_values', '4.4.4', cENMSiteValuesSchema, 'schemaREST1');
      await driver.sleep(1500);

      // ipv6 cENM schema
      await createSchemaREST('cenm_site_values', '6.6.6', cENMSiteValuesSchemaIPv6, 'schemaREST2');
      await driver.sleep(1500);

      await createDocumentPMREST('A_Health_cENM_Doc', schemaREST1._id, cENMSiteValuesDoc, 'enmDocumentREST1');
      await driver.sleep(1500);

      await createDocumentPMREST('A_Health_cENM_Doc_ipv6', schemaREST2._id, cENMSiteValuesDocIPv6, 'enmDocumentREST2');
      await driver.sleep(1500);

      // Create deployment so Document gets autopopulated
      await createDeploymentREST('A_Health_cENM_Depl', projectREST1._id, enmDocumentREST1._id, 'deploymentREST1');
      await driver.sleep(1500);

      beforeSuccessful = true;
    });

    it('should populate correct values when changing managed config during edit', async function () {
      // Labels
      await createLabelREST('cENM_Label', 'size', 'labelREST1');
      await driver.sleep(1500);
      await createLabelREST('cENM_Label2', 'size', 'labelREST2');
      await driver.sleep(1500);
      // Managed Configs
      await createManagedConfigREST('cENM_MC', schemaREST1._id, 'cENM_Label', cENMSiteValuesMC, 'managedConfigREST1');
      await createManagedConfigREST('cENM_MC2', schemaREST1._id, 'cENM_Label2', cENMSiteValuesMC2, 'managedConfigREST2');

      var cEnmSedName = 'cENM_site_doc';
      var schemaName = `${schemaREST1.name}-${schemaREST1.version}`;
      await accessCreateArtifactView('documents.createcEnmSed', 'documents/list/cenm_sed');
      await driver.findElement(By.id('name')).sendKeys(cEnmSedName);
      await driver.findElement(By.id('name')).sendKeys(webdriver.Key.ENTER);
      await select2Field('schema', schemaName);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'cENM_MC', 'css');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      // Verify
      (await driver.findElement(By.xpath(`//p[contains(.,"${cEnmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//a[contains(.,"cENM_MC")]')).getText()).should.containEql('cENM_MC');
      var hostPortValue = await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/ui-view/section/form/div/table/tbody/tr[25]/td[2]')).getText();
      var servicePortValue = await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/ui-view/section/form/div/table/tbody/tr[26]/td[2]')).getText();
      (hostPortValue.should.equal('4321'));
      (servicePortValue.should.equal('1234'));
      // Edit
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      // Remove old
      var removeButton = await driver.wait(until.elementLocated(By.id('delete_managedconfigs[0]')), 30000);
      await driver.wait(until.elementIsVisible(removeButton), 30000).click();
      await driver.sleep(500);
      await driver.switchTo().alert().accept();
      // Add new MC
      mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', 'cENM_MC2', 'css');
      // Save
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"creation successful!")]')), 30000);
      // Verify
      (await driver.findElement(By.xpath(`//p[contains(.,"${cEnmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath('//a[contains(.,"cENM_MC2")]')).getText()).should.containEql('cENM_MC2');
      hostPortValue = await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/ui-view/section/form/div/table/tbody/tr[25]/td[2]')).getText();
      servicePortValue = await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/ui-view/section/form/div/table/tbody/tr[26]/td[2]')).getText();
      (hostPortValue.should.equal('4444'));
      (servicePortValue.should.equal('5555'));
      await deleteArtifactREST('documents', false, cEnmSedName, false, false, false);
      await deleteArtifactREST('documents', false, 'cENM_MC', false, false, false);
      await deleteArtifactREST('documents', false, 'cENM_MC2', false, false, false);
    });

    it('should autopopulate cenm document with expected values after attaching to deployment from ipv4 to ipv6 document', async function () {
      // Check IPv4 populated correctly
      await accessEditArtifactView('documents.createcEnmSed', 'documents/list/cenm_sed', 'A_Health_cENM_Doc');
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);

      // IPv4 autopop
      (jsonContent.parameters.fm_vip_address).should.equal('10.150.241.171');
      (jsonContent.parameters.svc_FM_vip_fwd_ipaddress).should.equal('10.150.241.172');
      (jsonContent.parameters.cm_vip_address).should.equal('10.150.241.173');
      (jsonContent.parameters.pm_vip_address).should.equal('10.150.241.174');
      (jsonContent.parameters.amos_vip_address).should.equal('10.150.241.175');
      (jsonContent.parameters.general_scripting_vip_address).should.equal('10.150.241.176');
      (jsonContent.parameters.visinamingsb_service).should.equal('10.150.241.177');
      (jsonContent.parameters.itservices_0_vip_address).should.equal('10.150.241.178');
      (jsonContent.parameters.itservices_1_vip_address).should.equal('10.150.241.179');
      (jsonContent.parameters.loadBalancerIP).should.equal('10.150.241.180');

      // Check IPv6 has temp values before edit
      await accessEditArtifactView('documents.createcEnmSed', 'documents/list/cenm_sed', 'A_Health_cENM_Doc_ipv6');
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);

      (jsonContent.parameters.svc_fm_vip_ipv6address).should.equal('::');
      (jsonContent.parameters.svc_cm_vip_ipv6address).should.equal('::');
      (jsonContent.parameters.svc_pm_vip_ipv6address).should.equal('::');
      (jsonContent.parameters.amos_service_ipv6_ips).should.equal('::');
      (jsonContent.parameters.scripting_service_ipv6_ips).should.equal('::');
      (jsonContent.parameters.visinamingsb_service_ipv6_ips).should.equal('::');
      (jsonContent.parameters.itservices_service_0_ipv6_ips).should.equal('::');
      (jsonContent.parameters.itservices_service_1_ipv6_ips).should.equal('::');

      // Edit Deployment
      await accessEditArtifactView('deployments.create', 'deployments', 'A_Health_cENM_Depl');
      await select2DropdownSelect('enm-sed-select', 'A_Health_cENM_Doc_ipv6');
      await driver.sleep(1000);

      // Save
      var element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);

      // Check IPv6 has expected autopop values
      await accessEditArtifactView('documents.createcEnmSed', 'documents/list/cenm_sed', 'A_Health_cENM_Doc_ipv6');
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);

      (jsonContent.parameters.svc_fm_vip_ipv6address).should.equal('2001:1b70:6207:002a:0000:0000:0000:0010');
      (jsonContent.parameters.svc_cm_vip_ipv6address).should.equal('2001:1b70:6207:002a:0000:0000:0000:0011');
      (jsonContent.parameters.svc_pm_vip_ipv6address).should.equal('2001:1b70:6207:002a:0000:0000:0000:0012');
      (jsonContent.parameters.amos_service_ipv6_ips).should.equal('2001:1b70:6207:002a:0000:0000:0000:0013');
      (jsonContent.parameters.scripting_service_ipv6_ips).should.equal('2001:1b70:6207:002a:0000:0000:0000:0014');
      (jsonContent.parameters.visinamingsb_service_ipv6_ips).should.equal('2001:1b70:6207:002a:0000:0000:0000:0015');
      (jsonContent.parameters.itservices_service_0_ipv6_ips).should.equal('2001:1b70:6207:002a:0000:0000:0000:0016');
      (jsonContent.parameters.itservices_service_1_ipv6_ips).should.equal('2001:1b70:6207:002a:0000:0000:0000:0017');

      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('edit_cenm_sed_document_before_all');
      }
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
    });
  });

  describe('Edit VNF LCM SED Document @jenkins', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    var enmSchemaVersion = '1.65.4';
    var vnfSchemaVersion = '1.0.20';
    var vnflcmSchemaName = 'vnflcm_sed_schema';
    var buttonElement = 'documents.createVnfLcmSed';
    beforeSuccessful = false;
    before(async function () {
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);

      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      await createSchemaREST(vnflcmSchemaName, vnfSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);

      beforeSuccessful = true;
    });

    it('should check that VNFLCM sed auto populate works as expected', async function () {
      await accessEditArtifactView(buttonElement, 'documents/list/vnflcm_sed', vnflcmSedName);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.deployment_id).should.equal('testingDeployment');
      (jsonContent.parameters.dns_server_ip).should.equal('159.107.173.3,159.107.173.12');
      (jsonContent.parameters.internal_ipv4_subnet_cidr).should.equal('10.10.0.0/21');
      (jsonContent.parameters.external_ipv4_subnet_cidr).should.equal('10.150.241.0/24');
      (jsonContent.parameters.ip_version).should.equal('dual');
      (jsonContent.parameters.vim_HostName).should.equal('newpod.com');
      (jsonContent.parameters.vim_tenant_name).should.equal('Anewproject');
      (jsonContent.parameters.vim_url).should.equal('https://newpod.com');
      (jsonContent.parameters.vim_tenant_id).should.equal('123456789101112131415');
      (jsonContent.parameters.internal_ipv6_subnet_cidr).should.equal('fd5b:1fd5:8295:5339:0000:0000:0000:0000/64');
      (jsonContent.parameters.external_ipv6_subnet_cidr).should.equal('2001:1b70:6207:2a::/64');
      (jsonContent.parameters.external_ipv6_subnet_gateway).should.equal('2001:1b70:6207:2a:0:879:0:1');
      (jsonContent.parameters.external_ipv6_for_services_vm).should.equal('2001:1b70:6207:002a:0000:0000:0000:0041');
      (jsonContent.parameters.internal_ipv6_for_db_vm).should.equal('0000:0000:0000:0000:0000:0000:0000:0030');
      (jsonContent.parameters.availability_rule).should.equal('anti-affinity'); // anti-affinity in enm sed
    });

    it('should check that VNFLCM sed auto populate works as expected with HA enabled', async function () {
      await accessEditArtifactView(buttonElement, 'documents/list/vnflcm_sed', vnflcmSedName);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      await driver.findElement(By.css('[ng-model="vm.document.ha"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.ha"]')).isSelected()).should.equal(true);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      // Checking content
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.internal_ipv4_for_db_vm).should.equal('1.1.1.180,1.1.1.184');
      (jsonContent.parameters.internal_ipv4_for_services_vm).should.equal('1.1.1.181,1.1.1.185');
      (jsonContent.parameters.internal_ipv6_for_db_vm).should.equal('0000:0000:0000:0000:0000:0000:0000:0030,0000:0000:0000:0000:0000:0000:0000:0034');
      (jsonContent.parameters.internal_ipv6_for_services_vm).should.equal('0000:0000:0000:0000:0000:0000:0000:0031,0000:0000:0000:0000:0000:0000:0000:0035');
      (jsonContent.parameters.external_ipv6_for_services_vm).should.equal('2001:1b70:6207:002a:0000:0000:0000:0041,2001:1b70:6207:002a:0000:0000:0000:0043');
      (jsonContent.parameters.external_ipv4_for_services_vm).should.equal('10.150.241.200,10.150.241.202');
      (jsonContent.parameters.db_internal_vrrp_id).should.equal('105');
      (jsonContent.parameters.svc_internal_vrrp_id).should.equal('104');
      (jsonContent.parameters.svc_external_vrrp_id).should.equal('103');
      (jsonContent.parameters.services_vm_count).should.equal('2');
      (jsonContent.parameters.db_vm_count).should.equal('2');
      (jsonContent.parameters.availability_rule).should.equal('anti-affinity');
    });

    it('should check that VNFLCM sed auto populate works as expected when ipv6 is disabled', async function () {
      await accessEditArtifactView('documents.createEnmSed', 'documents/list/enm_sed', enmSedName);
      await driver.findElement(By.xpath('//button[contains(.,"Document Options")]')).click();
      // ip_version check
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isSelected()).should.equal(true);
      await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).click();
      (await driver.findElement(By.css('[ng-model="vm.document.ipv6"]')).isSelected()).should.equal(false);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 30000);
      await driver.wait(until.elementLocated(By.id('ipv6')), 30000);
      (await driver.findElement(By.id('ip_version')).getText()).should.equal('v4');
      // Check VNF_LCM SED
      await accessEditArtifactView(buttonElement, 'documents/list/vnflcm_sed', vnflcmSedName);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.deployment_id).should.equal('testingDeployment');
      (jsonContent.parameters.dns_server_ip).should.equal('159.107.173.3,159.107.173.12');
      (jsonContent.parameters.internal_ipv4_subnet_cidr).should.equal('10.10.0.0/21');
      (jsonContent.parameters.external_ipv4_subnet_cidr).should.equal('10.150.241.0/24');
      (jsonContent.parameters.ip_version).should.equal('4');
      (jsonContent.parameters.vim_HostName).should.equal('newpod.com');
      (jsonContent.parameters.vim_tenant_name).should.equal('Anewproject');
      (jsonContent.parameters.vim_url).should.equal('https://newpod.com');
      (jsonContent.parameters.vim_tenant_id).should.equal('123456789101112131415');
      (jsonContent.parameters.internal_ipv6_subnet_cidr).should.equal('::/64');
      (jsonContent.parameters.external_ipv6_subnet_cidr).should.equal('::/64');
      (jsonContent.parameters.external_ipv6_subnet_gateway).should.equal('::');
      (jsonContent.parameters.external_ipv6_for_services_vm).should.equal('::');
      (jsonContent.parameters.internal_ipv6_vip_for_services).should.equal('::');
      (jsonContent.parameters.internal_ipv6_for_db_vm).should.equal('::');
    });

    it('should reset VNFLCM sed document to auto populate temporary values after being removed from a deployment', async function () {
      // Create Old Schema
      var oldEnmSchemaVersion = '1.30.1';
      await createSchemaREST(enmSchemaName, oldEnmSchemaVersion, enmSedSchema, 'schemaREST3');
      await driver.sleep(1500);
      // Create Old ENM SED
      var oldEnmSedName = 'Aoldsed';
      await createDocumentPMREST(oldEnmSedName, schemaREST3._id, enmSedDocument, 'enmDocumentREST2');
      await driver.sleep(1500);
      // Editing Deployment
      await accessEditArtifactView('deployments.create', 'deployments', deploymentName);
      await select2Field('enm-sed-select', oldEnmSedName);
      await driver.sleep(60);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);
      // Checking VNF_LCM SED
      await accessEditArtifactView(buttonElement, 'documents/list/vnflcm_sed', vnflcmSedName);
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.deployment_id).should.equal('temporary');
      (jsonContent.parameters.dns_server_ip).should.equal('1.1.1.1,1.1.1.1');
      (jsonContent.parameters.internal_ipv4_subnet_cidr).should.equal('1.1.1.1/1');
      (jsonContent.parameters.internal_ipv6_subnet_cidr).should.equal('::/64');
      (jsonContent.parameters.external_ipv6_subnet_cidr).should.equal('::/64');
      (jsonContent.parameters.internal_ipv6_vip_for_services).should.equal('::');
      (jsonContent.parameters.external_ipv6_for_services_vm).should.equal('::');
      (jsonContent.parameters.vim_HostName).should.equal('temporary');
      (jsonContent.parameters.vim_tenant_name).should.equal('temporary');
      (jsonContent.parameters.vim_tenant_id).should.equal('1');
      (jsonContent.parameters.vim_url).should.equal('http://temporary.com');
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('edit_vnf_lcm_sed_document_before_all');
      }
      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
    });
  });

  describe('Edit Other Document @jenkins', function () {
    this.timeout(30000);
    this.retries(MAX_RETRIES);
    var otherSchemaName = 'do_automation';
    var schemaVersion = '2.0.2';
    var buttonElement = 'documents.createOther';
    beforeSuccessful = false;

    before(async function () {
      // Create Other Schema
      await createSchemaREST(otherSchemaName, schemaVersion, doSchema, 'schemaREST1');
      await driver.sleep(1500);
      var docName = 'Aotherdoc';
      // Create Other Document
      await createDocumentPMREST(docName, schemaREST1._id, doDocument, 'doDocumentREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should check that Other Document auto populate works as expected when editing', async function () {
      // Go to edit Other Document page
      await accessEditArtifactView(buttonElement, 'documents/list/other', 'Aotherdoc');
      // Select paste mode and get JSON.
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var pasteMode = await driver.findElement(By.id('pasteMode'));
      await pasteMode.click();
      await pasteMode.click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      // Check JSON content
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.VNF_LCM_Service_IP).should.equal('131.160.162.231');
      (jsonContent.CEE_Tenant_ID).should.equal('fd7ca141a54546af8283ac641bf782c4');
      (jsonContent.VDCID).should.equal('ba2804b3-f79f-457a-a4dd-aafe9afd8f0b');
      (jsonContent.VNF_MANAGER_ID).should.equal('3292ec05-d52c-41fe-b35a-a440fe4595de');
      (jsonContent.OSS_NOTIFICATION_SERVICE_IP).should.equal('131.160.131.51');
      (jsonContent.OSS_NOTIFICATION_SERVICE_HOST).should.equal('ieatENM5503-4');
      (jsonContent.OSS_MASTER_HOST_IP).should.equal('131.160.131.55');
      (jsonContent.OSS_MASTER_HOSTNAME).should.equal('ieatENM5503-8');
      (jsonContent.OSS_TYPE).should.equal('ENM');
      (jsonContent.CLOUD_MANAGER_TYPE).should.equal('CEE');
      (jsonContent.EXTERNAL_IP_FOR_SERVICES_VM).should.equal('131.160.162.240');
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('edit_other_document_before_all');
      }
      await deleteArtifactREST('documents', doDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
    });
  });

  describe('Edit Managed Config @jenkins', function () {
    this.timeout(30000);
    this.retries(MAX_RETRIES);
    var buttonElement = 'documents.createManagedConfig';
    var label5KTEST = '5KTEST';
    beforeSuccessful = false;
    var managedConfigName = '5KTEST_0.0.3';

    before(async function () {
      var schemaVersion = '0.0.10';
      // Create an ENM Schema
      await createSchemaREST(enmSchemaName, schemaVersion, enmSedSchema, 'schemaREST1');
      // Create a label
      await createLabelREST(label5KTEST, 'size', 'labelREST1');
      await driver.sleep(1500);
      // Create a Manged Config
      await createManagedConfigREST(managedConfigName, schemaREST1._id, label5KTEST, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should check that Managed Config auto populate works as expected when editing', async function () {
      // Go to edit Managed Config page
      await accessEditArtifactView(buttonElement, 'documents/list/managedconfigs', managedConfigName);
      // Select paste mode and get JSON
      await driver.findElement(By.id('pasteMode')).click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      var pasteMode = await driver.findElement(By.id('pasteMode'));
      await pasteMode.click();
      await pasteMode.click();
      await driver.wait(until.elementLocated(By.id('document_json')), 30000);
      await driver.sleep(1500);
      var jsonContent = await driver.findElement(By.id('document_json')).getAttribute('value');
      // Check JSON content
      await driver.sleep(1500);
      jsonContent = JSON.parse(jsonContent);
      (jsonContent.parameters.flavor_accesscontrol).should.equal('flavor_1vC4M');
      (jsonContent.parameters.flavor_amos).should.equal('flavor_4vC20M');
      (jsonContent.parameters.flavor_apserv).should.equal('flavor_2vC4M');
      (jsonContent.parameters.flavor_bnsiserv).should.equal('flavor_2vC4M');
      (jsonContent.parameters.flavor_cmevents).should.equal('flavor_2vC4M');
      (jsonContent.parameters.flavor_cmserv).should.equal('flavor_3vC6M');
      (jsonContent.parameters.flavor_cmutilities).should.equal('flavor_2vC4M');
      (jsonContent.parameters.flavor_cnom).should.equal('flavor_4vC8M');
      (jsonContent.parameters.flavor_comecimpolicy).should.equal('flavor_2vC4M');
      (jsonContent.parameters.flavor_dchistory).should.equal('flavor_1vC4M');
      (jsonContent.parameters.flavor_dlms).should.equal('flavor_1vC4M');
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('edit_enm_sed_document_before_all');
      }
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
    });
  });

  describe('Cascading Artifact Updates @jenkins', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    var ipv4StartRange = '10.150.241.171';
    var ipv4EndRange = '10.150.241.210';
    var enmSchemaVersion = '0.0.8';
    beforeSuccessful = false;
    before(async function () {
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);

      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);

      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1');
      await driver.sleep(1500);

      beforeSuccessful = true;
    });

    it('should not update a Project when a cascading dependant-object update fails', async function () {
      // Check initial full-range value
      await driver.get(`${baseUrl}projects`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="projects.create"]')), 30000);
      await driver.findElement(By.xpath(`//td[contains(.,"${projectName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath(`//h1[contains(.,"Viewing project '${projectName}'")]`)), 5000);
      var ipv4FullRange = `${ipv4StartRange} - ${ipv4EndRange}`;
      (await driver.findElement(By.xpath(`//p[contains(.,"${ipv4StartRange}")]`)).getText()).should.equal(ipv4FullRange);

      // Try modify end-range value
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('pod-select')), 30000);
      await driver.findElement(By.id('network.ipv4_ranges[0].end')).clear();
      await driver.findElement(By.id('network.ipv4_ranges[0].end')).sendKeys('10.150.241.26');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Project update error!")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"Project update error!")]')).isDisplayed()).should.equal(true);

      // Verify the project has not been updated
      await driver.get(`${baseUrl}projects`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="projects.create"]')), 30000);
      await driver.findElement(By.xpath(`//td[contains(.,"${projectName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath(`//h1[contains(.,"Viewing project '${projectName}'")]`)), 5000);
      (await driver.findElement(By.xpath(`//p[contains(.,"${ipv4StartRange}")]`)).isDisplayed()).should.equal(true);
    });

    it('should not update a Pod when a cascading dependant-object update fails', async function () {
      var newGatewayIP = '10.150.241.171';
      // Check initial gateway ip value
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="pods.create"]')), 30000);
      await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath(`//h1[contains(.,"Viewing pod '${podName}'")]`)), 5000);
      var origGatewayIP = await driver.findElement(By.xpath('//td[contains(.,"network1")]/../td[5]')).getText();
      origGatewayIP.should.not.equal(newGatewayIP);

      // Try modify gateway ip value
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('authUrl')), 30000);
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).clear();
      await driver.findElement(By.id('networks[0].ipv4_subnet.gateway_ip')).sendKeys(newGatewayIP);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//div[contains(.,"Project update error!")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"Project update error!")]')).isDisplayed()).should.equal(true);

      // Verify the pod has not been updated
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="pods.create"]')), 30000);
      await driver.findElement(By.xpath(`//td[contains(.,"${podName}")]`)).click();
      await driver.wait(until.elementLocated(By.xpath(`//h1[contains(.,"Viewing pod '${podName}'")]`)), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"network1")]/../td[5]')).isDisplayed()).should.equal(true);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('cascading_artifact_updates_before_all');
      }
      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
    });
  });

  describe('Searching Historical Logs @jenkins', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);
    beforeSuccessful = false;
    var changedName = 'AChangedpod';
    var enmSchemaVersion = '1.54.4';
    var vnflcmSchemaVersion = '1.0.20';
    var vnflcmSchemaName = 'vnflcm_sed_schema';
    var vnflcmSedName = 'Anewvnflcm';

    before(async function () {
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);
      await accessArtifactView('pods', podREST1);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      await driver.findElement(By.id('name')).clear();
      await driver.findElement(By.id('name')).sendKeys(changedName);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('networks[0].vrrp_range.start')), 30000);
      await driver.findElement(By.id('networks[0].vrrp_range.start')).clear();
      await driver.findElement(By.id('networks[0].vrrp_range.start')).sendKeys('50');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 5000);
      (await driver.findElement(By.xpath('//div[contains(.,"update successful!")]')).isDisplayed()).should.equal(true);

      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);

      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchemaVnflcmRequired, 'schemaREST1');
      await driver.sleep(1500);

      await createSchemaREST(vnflcmSchemaName, vnflcmSchemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);

      await createDocumentPMREST(vnflcmSedName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      beforeSuccessful = true;
    });

    it('should check the key of Pod in pods historical logs', async function () {
      var searchKey = 'name';

      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[3]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Pods Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${podREST1._id}`)), 30000);
      var element = await driver.findElement(By.id(`view-log-${podREST1._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      var quantity = await driver.findElements(By.id('log-cards'));
      quantity.length.should.equal(3);

      await driver.findElement(By.id('filter-field'), 30000);
      await driver.findElement(By.id('filter-field')).sendKeys(searchKey);
      await driver.wait(until.elementLocated(By.id('key-filter-button')), 30000);
      element = await driver.findElement(By.id('key-filter-button'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      quantity = await driver.findElements(By.id('log-cards'));
      quantity.length.should.equal(1);
      await driver.wait(until.elementLocated(By.id('allUpdates-btn')), 30000);
      element = await driver.findElement(By.id('allUpdates-btn'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath('//td[contains(.,"name")]')).isDisplayed()).should.equal(true);
    });

    it('should check the old value of Pod in pods historical logs', async function () {
      var searchValue = podName;

      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[3]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Pods Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${podREST1._id}`)), 30000);
      var element = await driver.findElement(By.id(`view-log-${podREST1._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      var quantity = await driver.findElements(By.id('log-cards'));
      quantity.length.should.equal(3);

      await driver.findElement(By.id('filter-field'), 30000);
      await driver.findElement(By.id('filter-field')).sendKeys(searchValue);
      await driver.wait(until.elementLocated(By.id('value-filter-button')), 30000);
      element = await driver.findElement(By.id('value-filter-button'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      quantity = await driver.findElements(By.id('log-cards'));
      quantity.length.should.equal(1);
      await driver.wait(until.elementLocated(By.id('allUpdates-btn')), 30000);
      element = await driver.findElement(By.id('allUpdates-btn'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath('//td[contains(.,"Anewpod")]')).isDisplayed()).should.equal(true);
    });

    it('should check the new value of Pod in pods historical logs', async function () {
      var searchValue = changedName;

      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[3]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Pods Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${podREST1._id}`)), 30000);
      var element = await driver.findElement(By.id(`view-log-${podREST1._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      var quantity = await driver.findElements(By.id('log-cards'));
      quantity.length.should.equal(3);

      await driver.findElement(By.id('filter-field'), 30000);
      await driver.findElement(By.id('filter-field')).sendKeys(searchValue);
      await driver.wait(until.elementLocated(By.id('value-filter-button')), 30000);
      element = await driver.findElement(By.id('value-filter-button'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      quantity = await driver.findElements(By.id('log-cards'));
      quantity.length.should.equal(1);
      await driver.wait(until.elementLocated(By.id('allUpdates-btn')), 30000);
      element = await driver.findElement(By.id('allUpdates-btn'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath('//td[contains(.,"AChangedpod")]')).isDisplayed()).should.equal(true);
    });

    it('should create and update document then see the name of the new schema in historical logs', async function () {
      var enmSchemaVersion2 = '0.0.40';
      var secondENMsed = 'logIdNameCheckSed';
      // Create Schema
      await createSchemaREST(enmSchemaName, enmSchemaVersion2, enmSedSchema, 'schemaREST3');
      await driver.sleep(1500);
      // Create ENM SED
      await createDocumentPMREST(secondENMsed, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST2');
      await driver.sleep(1500);

      // changing schema
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await accessArtifactView('documents', enmDocumentREST2);
      (await driver.findElement(By.xpath(`//p[contains(.,"${secondENMsed}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      await select2Field('schema', `enm_sed-${enmSchemaVersion2}`);
      await driver.wait(until.elementLocated(By.id('form-parameters-flavor_sdncontroller')), 30000);
      await driver.findElement(By.id('form-parameters-flavor_sdncontroller')).sendKeys('flavor_2vC6M');
      await driver.findElement(By.id('form-parameters-nfssdn_volume_size')).sendKeys('50');
      await driver.findElement(By.id('form-parameters-rhel6_isovol_size')).sendKeys('50');
      await driver.findElement(By.id('form-parameters-rhel6_updates_isovol_size')).sendKeys('50');
      await driver.findElement(By.id('form-parameters-sdncontroller_instances')).sendKeys('0');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);

      // check logs
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[2]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${enmDocumentREST2._id}`)), 30000);
      element = await driver.findElement(By.id(`view-log-${enmDocumentREST2._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      await driver.wait(until.elementLocated(By.id('allUpdates-btn')), 30000);
      element = await driver.findElement(By.id('allUpdates-btn'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath(`//td[contains(.,"enm_sed-${enmSchemaVersion}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"enm_sed-${enmSchemaVersion2}")]`)).isDisplayed()).should.equal(true);

      await deleteArtifactREST('documents', enmDocumentREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
    });

    it('should create and update document then see the name of the new managedconfig in historical logs', async function () {
      enmSchemaVersion = '0.0.30';
      var labelName = 'new5K';
      var secondENMsed = 'logIdNameCheckDoc';
      // Create Schema
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST3');
      await driver.sleep(1500);

      // Create ENM SED
      await createDocumentPMREST(secondENMsed, schemaREST3._id, enmSedDocument, 'enmDocumentREST2');
      await driver.sleep(1500);
      // Create label
      // 5K
      await createLabelREST(labelName, 'size', 'labelREST1');
      await driver.sleep(1500);
      // Create Manage Config
      // 5K
      await createManagedConfigREST(`5K_${enmSchemaVersion}`, schemaREST3._id, labelName, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);

      // Adding ManagedConfig
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await accessArtifactView('documents', enmDocumentREST2);
      (await driver.findElement(By.xpath(`//p[contains(.,"${secondENMsed}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', '5K', 'css');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);

      // check logs
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[2]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${enmDocumentREST2._id}`)), 30000);
      element = await driver.findElement(By.id(`view-log-${enmDocumentREST2._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      await driver.wait(until.elementLocated(By.id('allUpdates-btn')), 30000);
      element = await driver.findElement(By.id('allUpdates-btn'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('0-managedconfigs'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath(`//td[contains(.,"5K_${enmSchemaVersion}")]`)).isDisplayed()).should.equal(true);

      await deleteArtifactREST('documents', enmDocumentREST2, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
    });

    it('should create and update deployment then see the name of the new enm sed in historical logs', async function () {
      await createDocumentPMREST(enmSedName, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST1');
      await driver.sleep(1500);

      var secondENMsed = 'logIdNameCheckDep';
      await createDocumentPMREST(secondENMsed, schemaREST1._id, enmSedDocumentVnflcmRequired, 'enmDocumentREST2');
      await driver.sleep(1500);

      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1', schemaREST2.name, enmVnfLcmDocumentREST1._id);
      await driver.sleep(1500);

      await driver.get(`${baseUrl}deployments`);
      var buttonElement = 'deployments.create';
      await driver.wait(until.elementLocated(By.css(`[ui-sref="${buttonElement}"]`)), 5000);
      await accessArtifactView('deployments', deploymentREST1);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      await select2Field('enm-sed-select', secondENMsed);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);

      // check logs
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[5]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Deployments Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${deploymentREST1._id}`)), 30000);
      element = await driver.findElement(By.id(`view-log-${deploymentREST1._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      await driver.wait(until.elementLocated(By.id('allUpdates-btn')), 30000);
      element = await driver.findElement(By.id('allUpdates-btn'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('0-enm'));
      await driver.executeScript('arguments[0].click()', element);
      (await driver.findElement(By.xpath(`//td[contains(.,"${enmSedName}")]`)).isDisplayed()).should.equal(true);
      (await driver.findElement(By.xpath(`//td[contains(.,"${secondENMsed}")]`)).isDisplayed()).should.equal(true);

      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST2, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('search_logs_before_all');
      }
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
    });
  });

  describe('Restore @jenkins', function () {
    this.timeout(100000);
    this.retries(MAX_RETRIES);

    before(async function () {
      await createSchemaREST(enmSchemaName, '0.0.4', enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);
      await createLabelREST('labelRestore', 'size', 'labelREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });
    it('should check restore button is not visible on the view log of schemas historical logs without any updates', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[1]/a')).click();
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Schemas Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${schemaREST1._id}`)), 30000);
      var element = await driver.findElement(By.id(`view-log-${schemaREST1._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      (await driver.findElement(By.xpath('//button[contains(.,"Restore")]')).isDisplayed()).should.equal(false);
    });

    it('should check restore button is not visible on the view log of labels historical logs without any updates', async function () {
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
      await driver.findElement(By.xpath('/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[6]/a')).click();
      await driver.sleep(500);
      await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
      (await driver.findElement(By.xpath('//h1[contains(.,"Labels Historical Logs")]')).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.id(`view-log-${labelREST1._id}`)), 30000);
      var element = await driver.findElement(By.id(`view-log-${labelREST1._id}`));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(500);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      (await driver.findElement(By.xpath('//button[contains(.,"Restore")]')).isDisplayed()).should.equal(false);
    });

    it('should restore vENM document to previous state with managedConfigs change', async function () {
      var enmSchemaVersion = '0.0.31';
      var labelName = 'labelrestore5K';
      var vENMsed = 'restorevenmdoc';
      // Create Schema
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST2');
      await driver.sleep(1500);

      // Create ENM SED
      await createDocumentPMREST(vENMsed, schemaREST2._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);
      // Create label
      // 5K
      await createLabelREST(labelName, 'size', 'labelREST2');
      await driver.sleep(1500);
      // Create Manage Config
      // 5K
      await createManagedConfigREST(`5K_${enmSchemaVersion}`, schemaREST2._id, labelName, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);

      // Adding ManagedConfig
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await accessArtifactView('documents', enmDocumentREST1);
      await driver.sleep(1500);
      (await driver.findElement(By.xpath(`//p[contains(.,"${vENMsed}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', '5K', 'css');
      await driver.sleep(1500);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1500);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath(`//a[contains(.,"5K_${enmSchemaVersion}")]`)).isDisplayed()).should.equal(true);

      // restore to created
      await driver.get(`${baseUrl}/logs/documents/view/${enmDocumentREST1._id}`);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      element = await driver.findElement(By.id('restore-created'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(500);
      await driver.switchTo().alert().accept();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.id('mcs-none')).isDisplayed()).should.equal(true);

      // restore back to update change with managedconfig
      await driver.get(`${baseUrl}/logs/documents/view/${enmDocumentREST1._id}`);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      element = await driver.findElement(By.id('restore-1'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(500);
      await driver.switchTo().alert().accept();
      await driver.sleep(1500);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 10000);
      (await driver.findElement(By.xpath(`//a[contains(.,"5K_${enmSchemaVersion}")]`)).isDisplayed()).should.equal(true);

      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('labels', labelREST2, false, false, false);
    });

    it('should restore vENM document to previous state with schema change', async function () {
      var enmSchemaVersion = '0.0.32';
      var enmSchemaVersion2 = '0.0.33';
      var labelName = 'restore5K';
      var vENMsed = 'restorevenmdocSed';
      // Create Schema
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST2');
      await driver.sleep(1500);
      await createSchemaREST(enmSchemaName, enmSchemaVersion2, enmSedSchema, 'schemaREST3');
      await driver.sleep(1500);

      // Create ENM SED
      await createDocumentPMREST(vENMsed, schemaREST2._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);
      // Create label
      // 5K
      await createLabelREST(labelName, 'size', 'labelREST2');
      await driver.sleep(1500);
      // Create Manage Config
      // 5K
      await createManagedConfigREST(`5K_${enmSchemaVersion}`, schemaREST2._id, labelName, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);
      await createManagedConfigREST(`5K_${enmSchemaVersion2}`, schemaREST3._id, labelName, managedConfig5K, 'managedConfigREST2');
      await driver.sleep(1500);

      // Adding ManagedConfig
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await accessArtifactView('documents', enmDocumentREST1);
      (await driver.findElement(By.xpath(`//p[contains(.,"${vENMsed}")]`)).isDisplayed()).should.equal(true);
      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      var element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      var mcButton = await driver.wait(until.elementLocated(By.id('add-managedconfig')), 30000);
      await driver.wait(until.elementIsVisible(mcButton), 30000).click();
      await driver.wait(until.elementLocated(By.id('managedconfigs0-mc')), 30000);
      await driver.findElement(By.id('category[0]')).click();
      await driver.findElement(By.id('category[0]')).sendKeys(`size${webdriver.Key.ENTER}`);
      await select2Field('managedconfigs0-mc', '5K', 'css');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath(`//a[contains(.,"5K_${enmSchemaVersion}")]`)).isDisplayed()).should.equal(true);

      await driver.wait(until.elementLocated(By.xpath('//*[contains(text(), "Edit")]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Edit")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.id('name')), 30000);
      var schemaName = `${enmSchemaName}-${enmSchemaVersion2}`;
      await select2Field('schema', schemaName);
      await driver.wait(until.elementLocated(By.id('pasteMode')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath(`//a[contains(.,"5K_${enmSchemaVersion2}")]`)).isDisplayed()).should.equal(true);

      // restore to 1st update
      await driver.get(`${baseUrl}/logs/documents/view/${enmDocumentREST1._id}`);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      element = await driver.findElement(By.id('restore-1'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(500);
      await driver.switchTo().alert().accept();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath(`//a[contains(.,"5K_${enmSchemaVersion}")]`)).isDisplayed()).should.equal(true);

      // restore to 2nd update
      await driver.get(`${baseUrl}/logs/documents/view/${enmDocumentREST1._id}`);
      await driver.wait(until.elementLocated(By.id('view-object')), 30000);
      await driver.wait(until.elementLocated(By.className('log-card')), 30000);
      element = await driver.findElement(By.id('restore-2'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(500);
      await driver.switchTo().alert().accept();
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath(`//a[contains(.,"5K_${enmSchemaVersion2}")]`)).isDisplayed()).should.equal(true);

      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
      await deleteArtifactREST('labels', labelREST2, false, false, false);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('restore_before_all');
      }
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
    });
  });

  describe('Delete @jenkins', function () {
    this.timeout(150000);
    this.retries(MAX_RETRIES);
    beforeSuccessful = false;
    var enmSchemaVersion = '0.0.9';
    var labelName = 'new5K';
    before(async function () {
      // Create VNFLCM SED Schema
      var schemaVersion = '1.0.3';
      var schemaName = 'vnflcm_sed_schema';
      await createSchemaREST(schemaName, schemaVersion, vnflcmSchema, 'schemaREST1');
      await driver.sleep(1500);
      // Create VNFLCM Document
      var docName = 'Avnflcmdoc';
      await createDocumentPMREST(docName, schemaREST1._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);

      // Create Other Schema
      schemaVersion = '2.0.3';
      schemaName = 'do_automation';
      await createSchemaREST(schemaName, schemaVersion, doSchema, 'schemaREST2');
      await driver.sleep(1500);
      // Create Other Document
      docName = 'Aotherdoc';
      await createDocumentPMREST(docName, schemaREST2._id, doDocument, 'doDocumentREST1');
      await driver.sleep(1500);
      // Create pod
      await createPodREST(podName, 'podREST1');
      await driver.sleep(1500);
      // Create Project
      await createProjectREST(projectName, podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(1500);
      // Create Schema
      await createSchemaREST(enmSchemaName, enmSchemaVersion, enmSedSchema, 'schemaREST3');
      await driver.sleep(1500);

      // Create ENM SED
      await createDocumentPMREST(enmSedName, schemaREST3._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);
      // Create label
      // 5K
      await createLabelREST(labelName, 'size', 'labelREST1');
      await driver.sleep(1500);
      // Create Manage Config
      // 5K
      await createManagedConfigREST(`5K_${enmSchemaVersion}`, schemaREST3._id, labelName, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);
      // Create Deployment
      await createDeploymentREST(deploymentName, projectREST1._id, enmDocumentREST1._id, 'deploymentREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should not delete enm sed schema attached to sed document', async function () {
      (await deleteItem('schemas.create', enmSchemaName, enmSchemaVersion, 'schemas', false)).should.equal(true);
    });

    it('should not delete vnflcm sed schema attached to vnflcm document', async function () {
      (await deleteItem('schemas.create', 'vnflcm_sed_schema', '1.0.3', 'schemas', false)).should.equal(true);
    });

    it('should not delete other schema attached to other document', async function () {
      (await deleteItem('schemas.create', 'do_automation', '2.0.3', 'schemas', false)).should.equal(true);
    });

    it('should not delete label attached to managed config', async function () {
      (await deleteItem('labels.create', labelName, labelName, 'labels', false)).should.equal(true);
    });

    it('should not delete sed document attached to deployment', async function () {
      (await deleteItem('documents.createEnmSed', enmSedName, enmSedName, 'documents/list/enm_sed', false)).should.equal(true);
    });

    it('should not delete pod attached to project', async function () {
      (await deleteItem('pods.create', podName, podName, 'pods', false)).should.equal(true);
    });

    it('should not delete project attached to deployment', async function () {
      (await deleteItem('projects.create', projectName, projectName, 'projects', false)).should.equal(true);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('delete_before_all');
      }
      await deleteArtifactREST('deployments', deploymentREST1, false, false, false);
      await deleteArtifactREST('projects', projectREST1, false, false, false);
      await deleteArtifactREST('pods', podREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', doDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
    });
  });

  describe('Download Document @jenkins', function () {
    this.timeout(80000);
    this.retries(MAX_RETRIES);
    var docFile;
    var enmSedDocumentName = 'enmdocdownload';
    var managedConfigName = 'managedConfig_0.0.10';
    var vnflcmDocumentName = 'vnflcmdocdownload';
    var otherDocumentName = 'otherdocdownload';
    beforeSuccessful = false;
    before(async function () {
      var schemaVersion = '0.0.10';
      // ENM Schema
      await createSchemaREST(enmSchemaName, schemaVersion, enmSedSchema, 'schemaREST1');
      await driver.sleep(1500);
      // ENM SED
      await createDocumentPMREST(enmSedDocumentName, schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(1500);
      var label = 'download';
      await createLabelREST(label, 'size', 'labelREST1');
      await driver.sleep(1500);
      // Create Manage Config
      // 5K
      await createManagedConfigREST(managedConfigName, schemaREST1._id, label, managedConfig5K, 'managedConfigREST1');
      await driver.sleep(1500);
      // VNFLCM Schema
      schemaVersion = '1.0.4';
      var schemaName = 'vnflcm_sed_schema';
      await createSchemaREST(schemaName, schemaVersion, vnflcmSchema, 'schemaREST2');
      await driver.sleep(1500);
      // Create VNFLCM Document
      await createDocumentPMREST(vnflcmDocumentName, schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(1500);
      // Create Other Schema
      schemaVersion = '2.0.4';
      schemaName = 'do_automation';
      await createSchemaREST(schemaName, schemaVersion, doSchema, 'schemaREST3');
      await driver.sleep(1500);
      // Create Other Document
      await createDocumentPMREST(otherDocumentName, schemaREST3._id, doDocument, 'doDocumentREST1');
      await driver.sleep(1500);
      beforeSuccessful = true;
    });

    it('should download ENM sed document json with parameters', async function () {
      docFile = `/opt/SmokeTest/${enmSedDocumentName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createEnmSed"]')), 30000);
      var linkLocation = await findItemInTable(enmSedDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('withoutDefaults'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'parameters')).should.equal(true);
    });

    it('should download ENM sed document json with parameter_defaults', async function () {
      docFile = `/opt/SmokeTest/${enmSedDocumentName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createEnmSed"]')), 30000);
      var linkLocation = await findItemInTable(enmSedDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('defaults'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'parameter_defaults')).should.equal(true);
    });

    it('should download ENM sed document yaml', async function () {
      docFile = `/opt/SmokeTest/${enmSedDocumentName}_sed.yaml`;
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createEnmSed"]')), 30000);
      var linkLocation = await findItemInTable(enmSedDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.css('[ng-click="vm.saveYaml()"]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Download to YAML")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docYaml = fs.readFileSync(docFile, 'utf8');
      (docYaml.includes('parameter_defaults')).should.equal(true);
    });

    it('should download VNFLCM sed document json with parameters', async function () {
      docFile = `/opt/SmokeTest/${vnflcmDocumentName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/vnflcm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createVnfLcmSed"]')), 30000);
      var linkLocation = await findItemInTable(vnflcmDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('withoutDefaults'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'parameters')).should.equal(true);
    });

    it('should download VNFLCM sed document json with parameter_defaults', async function () {
      docFile = `/opt/SmokeTest/${vnflcmDocumentName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/vnflcm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createVnfLcmSed"]')), 30000);
      var linkLocation = await findItemInTable(vnflcmDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('defaults'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'parameter_defaults')).should.equal(true);
    });

    it('should download VNFLCM sed document yaml', async function () {
      docFile = `/opt/SmokeTest/${vnflcmDocumentName}_sed.yaml`;
      await driver.get(`${baseUrl}documents/list/vnflcm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createVnfLcmSed"]')), 30000);
      var linkLocation = await findItemInTable(vnflcmDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.css('[ng-click="vm.saveYaml()"]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Download to YAML")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docYaml = fs.readFileSync(docFile, 'utf8');
      (docYaml.includes('parameter_defaults')).should.equal(true);
    });

    it('should download Managed config json with parameters', async function () {
      docFile = `/opt/SmokeTest/${managedConfigName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/managedconfigs`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createManagedConfig"]')), 30000);
      var linkLocation = await findItemInTable(managedConfigName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('withoutDefaults'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'parameters')).should.equal(true);
    });

    it('should download Managed config json with parameter_defaults', async function () {
      docFile = `/opt/SmokeTest/${managedConfigName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/managedconfigs`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createManagedConfig"]')), 30000);
      var linkLocation = await findItemInTable(managedConfigName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//button[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//button[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      element = await driver.findElement(By.id('defaults'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'parameter_defaults')).should.equal(true);
    });

    it('should download Managed config yaml', async function () {
      docFile = `/opt/SmokeTest/${managedConfigName}_sed.yaml`;
      await driver.get(`${baseUrl}documents/list/managedconfigs`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createManagedConfig"]')), 30000);
      var linkLocation = await findItemInTable(managedConfigName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.css('[ng-click="vm.saveYaml()"]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Download to YAML")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docYaml = fs.readFileSync(docFile, 'utf8');
      (docYaml.includes('parameter_defaults')).should.equal(true);
    });

    it('should download Other document json', async function () {
      docFile = `/opt/SmokeTest/${otherDocumentName}_sed.json`;
      await driver.get(`${baseUrl}documents/list/other`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createOther"]')), 30000);
      var linkLocation = await findItemInTable(otherDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//a[contains(.,"Download to JSON")]')), 30000);
      element = await driver.findElement(By.xpath('//a[contains(.,"Download to JSON")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docJson = fs.readFileSync(docFile, 'utf8');
      docJson = JSON.parse(docJson);
      (Object.prototype.hasOwnProperty.call(docJson, 'VNF_LCM_Service_IP')).should.equal(true);
    });

    it('should download Other document yaml', async function () {
      docFile = `/opt/SmokeTest/${otherDocumentName}_sed.yaml`;
      await driver.get(`${baseUrl}documents/list/other`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createOther"]')), 30000);
      var linkLocation = await findItemInTable(otherDocumentName);
      var element = await driver.findElement(By.xpath(linkLocation));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.css('[ng-click="vm.saveYaml()"]')), 30000);
      element = await driver.findElement(By.xpath('//*[contains(text(), "Download to YAML")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.sleep(1000);
      var docYaml = fs.readFileSync(docFile, 'utf8');
      (docYaml.includes('VNF_LCM_Service_IP')).should.equal(true);
    });

    afterEach(async function () {
      await removeFile(docFile);
    });

    after(async function () {
      if (!beforeSuccessful) {
        await takeScreenshot('download_document_before_all');
      }
      await deleteArtifactREST('documents', enmDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', doDocumentREST1, false, false, false);
      await deleteArtifactREST('documents', managedConfigREST1, false, false, false);
      await deleteArtifactREST('documents', enmVnfLcmDocumentREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await deleteArtifactREST('schemas', schemaREST3, false, false, false);
      await deleteArtifactREST('labels', labelREST1, false, false, false);
    });
  });

  describe('Help & API Documentation @jenkins', function () {
    this.retries(MAX_RETRIES);
    it('should get Help Documentation page', async function () {
      this.timeout(20000);
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.sleep(500);
      await driver.findElement(By.xpath('//a[contains(.,"Help")]')).click();
      var element = await driver.findElement(By.css('[href="/helpdocs"]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.getAllWindowHandles().then(async function gotWindowHandles(allHandles) {
        await driver.switchTo().window(allHandles[1]);
        await driver.wait(until.elementLocated(By.xpath('//a[contains(.,"Help Center")]')), 30000);
        var found = false;
        try {
          await driver.findElement(By.css('[href="#help/app/helpdocs/topic/overview"]'));
          found = true;
        } catch (err) { /* Do Nothing */ }
        await driver.close();
        await driver.switchTo().window(allHandles[0]);
        found.should.be.equal(true);
      });
    });

    it('should get API Documentation page', async function () {
      this.timeout(20000);
      await driver.get(baseUrl);
      await driver.findElement(By.className('navbar-toggle')).click();
      await driver.sleep(500);
      await driver.findElement(By.xpath('//a[contains(.,"Help")]')).click();
      var element = await driver.findElement(By.css('[href="/apidocs"]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.getAllWindowHandles().then(async function gotWindowHandles(allHandles) {
        await driver.switchTo().window(allHandles[1]);
        await driver.wait(until.elementLocated(By.css('[alt="Swagger UI"]')), 30000);
        var found = false;
        try {
          await driver.findElement(By.css('[href="#/Deployments"]'));
          found = true;
        } catch (err) { /* Do Nothing */ }
        await driver.close();
        await driver.switchTo().window(allHandles[0]);
        found.should.be.equal(true);
      });
    });
  });

  describe('READ-ONLY Health Tests @healthtest', function () {
    var pageTitles = ['Schemas', 'Pods', 'Projects', 'Deployments', 'Labels'];
    var documentTypes = [{ type: 'vENM SEDs', path: 'enm_sed' }, { type: 'cENM SEDs', path: 'cenm_sed' }, { type: 'VNF LCM SEDs', path: 'vnflcm_sed' }, { type: 'Managed Configs', path: 'managedconfigs' }, { type: 'Other Documents', path: 'other' }];

    var allPageTitles = ['Schemas', 'Documents', 'Pods', 'Projects', 'Deployments', 'Labels'];
    var liElementCounter = 1;

    describe('Home Page Elements @jenkins', function () {
      this.timeout(30000);
      this.retries(MAX_RETRIES);

      it('Home Page Welcome message should exist', async function () {
        await driver.get(baseUrl);
        (await driver.findElement(By.xpath('//h1[contains(.,"Welcome to the Deployment Inventory Tool")]')).isDisplayed()).should.equal(true);
      });

      it('Home Page vENM Steps image should exist', async function () {
        await driver.get(baseUrl);
        await driver.wait(until.elementLocated(By.css('[alt="vENM Steps"]')), 30000);
        (await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/section/div/div/div[2]/div[1]/div/div[3]/div/img')).isDisplayed()).should.equal(true);
      });

      it('Home Page cENM Steps image should exist', async function () {
        await driver.get(baseUrl);
        await driver.wait(until.elementLocated(By.css('[alt="vENM Steps"]')), 30000);
        var element = await driver.findElement(By.id('cenm-thumb'));
        await driver.executeScript('arguments[0].click()', element);
        // Give time for image to change
        await driver.sleep(1000);
        (await driver.findElement(By.xpath('/html/body/div[1]/section/section/section/section/div/div/div[2]/div[1]/div/div[4]/div/img')).isDisplayed()).should.equal(true);
      });
    });

    describe('Nav-Bar Elements @jenkins', function () {
      this.timeout(30000);
      this.retries(MAX_RETRIES);

      allPageTitles.forEach(function (title) {
        it((`${title} navbar link should exist`), async function () {
          await driver.get(baseUrl);
          var webElements = await driver.findElement(By.id('navbar-toggle')).isDisplayed();
          if (webElements) {
            await driver.findElement(By.css('[id="navbar-toggle"]')).click();
          }
          if (title !== 'Documents') {
            (await driver.findElement(By.xpath(`//a[contains(.,"${title}")]`)).isDisplayed()).should.equal(true);
          } else {
            await driver.findElement(By.xpath(`//a[contains(.,"${title}")]`)).click();
            (await driver.findElement(By.xpath('//a[contains(.,"vENM SEDs")]')).getText()).should.equal('vENM SEDs');
          }
        });
      });
    });

    pageTitles.forEach(function (title) {
      describe((`${title} List-View @jenkins`), function () {
        this.timeout(30000);
        this.retries(MAX_RETRIES);

        it('Create new button should exist', async function () {
          var titleLowerCase = title.toLowerCase();
          var url = (baseUrl + titleLowerCase);
          await driver.get(url);
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          (await driver.findElement(By.xpath(`//a[contains(@ui-sref,"${titleLowerCase}.create")]`)).isDisplayed()).should.equal(true);
        });

        it('Search field should exist', async function () {
          var url = (baseUrl + title).toLowerCase();
          await driver.get(url);
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          (await driver.findElement(By.id('filter-field')).isDisplayed()).should.equal(true);
        });

        if (title === 'Schemas') {
          it('Schemas Show Snapshots toggle button should exist', async function () {
            var url = (baseUrl + title).toLowerCase();
            await driver.get(url);
            await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
            (await driver.findElement(By.xpath('//toggle[contains(@ng-model,"vm.showAllSchemaVersions")]')).isDisplayed()).should.equal(true);
          });
        }

        if (title === 'Schemas' || title === 'Labels') {
          it('Datatable should exist', async function () {
            var url = (baseUrl + title).toLowerCase();
            await driver.get(url);
            await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
            // Data tables not visible during smoke test as there are no artifacts
            if (baseUrl === 'http://atvdit.athtem.eei.ericsson.se/') {
              var elementId = await driver.findElement(By.css('table[id$=list-table]')).getAttribute('id');
              (await driver.findElement(By.id(elementId)).isDisplayed()).should.equal(true);
            }
          });
        }
      });
    });

    documentTypes.forEach(function (title, index) {
      describe((`${title.type} Document List-View`), function () {
        this.timeout(30000);
        this.retries(MAX_RETRIES);

        var documentsCreateButton = ['createEnmSed', 'createcEnmSed', 'createVnfLcmSed', 'createManagedConfig', 'createOther'];

        it('Create new document button should exist', async function () {
          var url = `${baseUrl}documents/list/${title.path}`;
          await driver.get(url);

          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          (await driver.findElement(By.xpath(`//a[contains(@ui-sref,"documents.${documentsCreateButton[index]}")]`)).isDisplayed()
          ).should.equal(true);
        });

        it('Search field should exist', async function () {
          var url = `${baseUrl}documents/list/${title.path}`;
          await driver.get(url);
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          (await driver.findElement(By.id('filter-field')).isDisplayed()).should.equal(true);
        });

        it('Show Snapshots toggle button should exist', async function () {
          var url = `${baseUrl}documents/list/${title.path}`;
          await driver.get(url);
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          (await driver.findElement(By.xpath('//toggle[contains(@ng-model,"vm.showDocumentsFromAllSchemaVersions")]')).isDisplayed()).should.equal(true);
        });

        it('Datatable should exist', async function () {
          var url = `${baseUrl}documents/list/${title.path}`;
          await driver.get(url);
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          // Data tables not visible during smoke test as there are no artifacts
          if (baseUrl === 'http://atvdit.athtem.eei.ericsson.se/') {
            var elementId = await driver.findElement(By.css('table[id$=list-table]')).getAttribute('id');
            (await driver.findElement(By.id(elementId)).isDisplayed()).should.equal(true);
          }
        });
      });
    });

    allPageTitles.forEach(function (logPageName) {
      describe(`${logPageName} Logs List View @jenkins`, function () {
        this.timeout(30000);
        this.retries(MAX_RETRIES);

        if (logPageName === 'Schemas') {
          it('should have snapshot toggle', async function () {
            await driver.get(baseUrl);
            await driver.findElement(By.className('navbar-toggle')).click();
            await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
            await driver.findElement(By.xpath(`/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[${liElementCounter}]/a`)).click();
            await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
            (await driver.findElement(By.xpath(`//h1[contains(.,"${logPageName} Historical Logs")]`)).isDisplayed()).should.equal(true);
            (await driver.findElement(By.xpath('//toggle[contains(@ng-model,"vm.showAllLogVersions")]')).isDisplayed()).should.equal(true);
          });
        }

        if (logPageName === 'Documents') {
          it('should have documents dropdown', async function () {
            await driver.get(baseUrl);
            await driver.findElement(By.className('navbar-toggle')).click();
            await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
            await driver.findElement(By.xpath(`/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[${liElementCounter}]/a`)).click();
            await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
            (await driver.findElement(By.xpath('//h1[contains(.,"Historical Logs")]')).isDisplayed()).should.equal(true);
            (await driver.findElement(By.xpath('//button[contains(.,"Document Type")]')).isDisplayed()).should.equal(true);
          });
        }

        it('should have search field', async function () {
          await driver.get(baseUrl);
          await driver.findElement(By.className('navbar-toggle')).click();
          await driver.wait(until.elementLocated(By.xpath('//a[contains(.,"Logs")]')), 30000);
          await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
          await driver.sleep(2000);
          await driver.findElement(By.xpath(`/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[${liElementCounter}]/a`)).click();
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          if (logPageName === 'Documents') logPageName = '';
          (await driver.findElement(By.xpath(`//h1[contains(.,"${logPageName} Historical Logs")]`)).isDisplayed()).should.equal(true);
          (await driver.findElement(By.id('filter-field')).isDisplayed()).should.equal(true);
        });

        it('should have Datatable', async function () {
          await driver.get(baseUrl);
          await driver.findElement(By.className('navbar-toggle')).click();
          await driver.findElement(By.xpath('//a[contains(.,"Logs")]')).click();
          await driver.sleep(2000);
          await driver.findElement(By.xpath(`/html/body/div/header/div/nav/ul[1]/li[7]/ul/li[${liElementCounter}]/a`)).click();
          await driver.wait(until.elementLocated(By.className(pageHeader)), 30000);
          liElementCounter += 1;
          (await driver.findElement(By.xpath(`//h1[contains(.,"${logPageName} Historical Logs")]`)).isDisplayed()).should.equal(true);
          (await driver.findElement(By.xpath('//table[contains(@id,"live-table")]/tbody/tr')).isDisplayed()).should.equal(true);
          (await driver.findElement(By.xpath('//table[contains(@id,"deleted-table")]/tbody/tr')).isDisplayed()).should.equal(true);
        });
      });
    });

    afterEach(function () {
      if (this.currentTest.state === 'failed') {
        healthTestsFailed = true;
        failedHealthTestsMessage += `\n ${this.currentTest.fullTitle().replace(/ /g, '_')}`;
      }
    });
  });

  describe('CRUD Health Tests @healthtest @jenkins', function () {
    this.timeout(200000);
    this.retries(MAX_RETRIES);

    before(async function () {
      // eslint-disable-next-line no-console
      console.log('\n\tMaking sure its safe to create test artifacts');
      await removeHealthCheckArtifacts();
    });

    it('Create an ENM Schema and see it in the Schemas list', async function () {
      await newSchemaSetup('enm_sed', '999.999.998', enmSedSchema);
      await driver.get(`${baseUrl}schemas`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="schemas.create"]')), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"999.999.998")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the ENM Schema', async function () {
      (await deleteItem('schemas.create', 'enm_sed', '999.999.998', 'schemas')).should.equal(false);
    });

    it('Create an ENM SED and see it in the Documents list', async function () {
      await createSchemaREST('enm_sed', '999.999.997', enmSedSchema, 'schemaREST1');
      await driver.sleep(2500);
      await newDocumentPMsetup('A_Health_Doc_ENM', 'enm_sed-999.999.997', enmSedDocument, 'createEnmSed', 'enm_sed');
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createEnmSed"]')), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Doc_ENM")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the ENM SED Document', async function () {
      await driver.get(`${baseUrl}documents/list/enm_sed`);
      await deleteArtifactREST('documents', false, 'A_Health_Doc_ENM', false, false);
      await driver.sleep(1500);
      (await deleteItem('schemas.create', 'enm_sed', '999.999.997', 'schemas')).should.equal(false);
    });

    it('Create an VNF_LCM Schema and see it in the Schemas list', async function () {
      await newSchemaSetup('vnflcm_sed_schema', '999.999.989', vnflcmSchema);
      await driver.get(`${baseUrl}schemas`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="schemas.create"]')), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"999.999.989")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the VNF_LCM Schema', async function () {
      (await deleteItem('schemas.create', 'vnflcm_sed_schema', '999.999.989', 'schemas')).should.equal(false);
    });

    it('Create an VNF_LCM SED and see it in the Documents list', async function () {
      await createSchemaREST('vnflcm_sed_schema', '999.999.979', vnflcmSchema, 'schemaREST1');
      await driver.sleep(2500);
      await newDocumentPMsetup('A_Health_Doc_VNFLCM', 'vnflcm_sed_schema-999.999.979', vnflcmDocument, 'createVnfLcmSed', 'vnflcm_sed');
      await driver.get(`${baseUrl}documents/list/vnflcm_sed`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createVnfLcmSed"]')), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Doc_VNFLCM")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the VNF_LCM SED Document', async function () {
      await deleteArtifactREST('documents', false, 'A_Health_Doc_VNFLCM', false, false);
      await driver.sleep(1500);
      (await deleteItem('schemas.create', 'vnflcm_sed_schema', '999.999.979', 'schemas')).should.equal(false);
    });

    it('Create Other Schema and see it in the Schemas list', async function () {
      await newSchemaSetup('do_automation', '999.999.899', doSchema);
      await driver.sleep(2500);
      await driver.get(`${baseUrl}schemas`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="schemas.create"]')), 5000);
      (await driver.findElement(By.xpath('//td[contains(.,"999.999.899")]')).isDisplayed()).should.equal(true);
    });

    it('Delete Other Schema', async function () {
      (await deleteItem('schemas.create', 'do_automation', '999.999.899', 'schemas')).should.equal(false);
    });

    it('Create Other SED and see it in the Documents list', async function () {
      await createSchemaREST('do_automation', '999.999.799', doSchema);
      await driver.sleep(2500);
      await newDocumentPMsetup('A_Health_Doc_Other', 'do_automation-999.999.799', doDocument, 'createOther', 'other');
      await driver.get(`${baseUrl}documents/list/other`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="documents.createOther"]')), 10000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Doc_Other")]')).isDisplayed()).should.equal(true);
    });

    it('Delete Other SED Document', async function () {
      await deleteArtifactREST('documents', false, 'A_Health_Doc_Other', false, false);
      await driver.sleep(1500);
      (await deleteItem('schemas.create', 'do_automation', '999.999.799', 'schemas')).should.equal(false);
    });

    it('Create Label and see it in the Labels list', async function () {
      await newLabelSetup('A_Health_Label');
      await driver.get(`${baseUrl}labels`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="labels.create"]')), 10000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Label")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the Label', async function () {
      (await deleteItem('labels.create', 'A_Health_Label', 'A_Health_Label', 'labels')).should.equal(false);
    });

    it('Create Pod and see it in the Pods list', async function () {
      await newPodSetup('A_Health_Pod');
      await driver.get(`${baseUrl}pods`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="pods.create"]')), 10000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Pod")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the Pod', async function () {
      (await deleteItem('pods.create', 'A_Health_Pod', 'A_Health_Pod', 'pods')).should.equal(false);
    });

    it('Create a Project and see it in the Projects list', async function () {
      await createPodREST('A_Health_Pod1', 'podREST1');
      await driver.sleep(2500);
      await newProjectSetup('A_Health_Project', 'A_Health_Pod1');
      await driver.get(`${baseUrl}projects`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="projects.create"]')), 10000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Project")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the Project', async function () {
      await deleteItem('projects.create', 'A_Health_Project', 'A_Health_Project', 'projects');
      (await deleteItem('pods.create', 'A_Health_Pod1', 'A_Health_Pod1', 'pods')).should.equal(false);
    });

    it('Create VNF_LCM Deployment and see it in the Deployments list', async function () {
      await createPodREST('A_Health_Pod2', 'podREST1');
      await driver.sleep(2500);
      await createProjectREST('A_Health_Project2', podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(2500);
      await createSchemaREST('enm_sed', '999.999.996', enmSedSchema, 'schemaREST1');
      await driver.sleep(2500);
      await createDocumentPMREST('A_Health_Doc_ENM2', schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(2500);
      await createSchemaREST('vnflcm_sed_schema', '999.999.969', vnflcmSchema, 'schemaREST2');
      await driver.sleep(2500);
      await createDocumentPMREST('A_Health_Doc_VNFLCM2', schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(2500);
      await newDeploymentSetupWithVnflcm('A_Health_Deployment_Vnflcm', 'A_Health_Project2', 'A_Health_Doc_ENM2', 'A_Health_Doc_VNFLCM2');
      await driver.get(`${baseUrl}deployments`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="deployments.create"]')), 10000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Deployment_Vnflcm")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the VNF_LCM Deployment', async function () {
      await deleteItem('deployments.create', 'A_Health_Deployment_Vnflcm', 'A_Health_Deployment_Vnflcm', 'deployments');
      await deleteArtifactREST('documents', false, 'A_Health_Doc_VNFLCM2', false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('documents', false, 'A_Health_Doc_ENM2', false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('projects', false, 'A_Health_Project2', false, false);
      await driver.sleep(1500);
      (await deleteItem('pods.create', 'A_Health_Pod2', 'A_Health_Pod2', 'pods')).should.equal(false);
    });

    it('Create VNF_LCM Deployment with Jira Issue and see Issue within Deployment', async function () {
      await createPodREST('A_Health_Pod3', 'podREST1');
      await driver.sleep(2500);
      await createProjectREST('A_Health_Project3', podREST1._id, 'network1', '10.150.241.171', '10.150.241.210', '2001:1b70:6207:2a:0000:0000:0000:0010', '2001:1b70:6207:2a:0000:0000:0000:0050', 'projectREST1');
      await driver.sleep(2500);
      await createSchemaREST('enm_sed', '999.999.995', enmSedSchema, 'schemaREST1');
      await driver.sleep(2500);
      await createDocumentPMREST('A_Health_Doc_ENM3', schemaREST1._id, enmSedDocument, 'enmDocumentREST1');
      await driver.sleep(2500);
      await createSchemaREST('vnflcm_sed_schema', '999.999.959', vnflcmSchema, 'schemaREST2');
      await driver.sleep(2500);
      await createDocumentPMREST('A_Health_Doc_VNFLCM3', schemaREST2._id, vnflcmDocument, 'enmVnfLcmDocumentREST1');
      await driver.sleep(2500);
      await accessCreateArtifactView('deployments.create', 'deployments');
      await driver.findElement(By.id('name')).sendKeys('A_Health_Deployment_Vnflcm_Jira');
      await select2Field('project-select', 'A_Health_Project3');
      await select2Field('enm-sed-select', 'A_Health_Doc_ENM3');
      await driver.wait(until.elementLocated(By.id('select2-vnfLcm-sed-select-container')), 1000);
      await select2Field('vnfLcm-sed-select', 'A_Health_Doc_VNFLCM3');
      var element = await driver.findElement(By.xpath('//button[contains(.,"Add JIRA Issue")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.findElement(By.name('jira_issues[0]')).sendKeys('CIP-30065');
      element = await driver.findElement(By.xpath('//button[contains(.,"Save")]'));
      await driver.executeScript('arguments[0].click()', element);
      await driver.wait(until.elementLocated(By.xpath('//h1[contains(.,"Viewing")]')), 8000);
      (await driver.findElement(By.xpath('//td[contains(.,"CIP-30065")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the VNF_LCM Deployment with Jira Issue', async function () {
      await deleteItem('deployments.create', 'A_Health_Deployment_Vnflcm_Jira', 'A_Health_Deployment_Vnflcm_Jira', 'deployments');
      await deleteArtifactREST('documents', false, 'A_Health_Doc_VNFLCM3', false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('schemas', schemaREST2, false, false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('documents', false, 'A_Health_Doc_ENM3', false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('schemas', schemaREST1, false, false, false);
      await driver.sleep(1500);
      await deleteArtifactREST('projects', false, 'A_Health_Project3', false, false);
      await driver.sleep(1500);
      (await deleteItem('pods.create', 'A_Health_Pod3', 'A_Health_Pod3', 'pods')).should.equal(false);
    });

    it('Create a Group and see it in the Groups list', async function () {
      await newGroupSetup('A_Health_Group');
      await driver.get(`${baseUrl}groups`);
      await driver.wait(until.elementLocated(By.css('[ui-sref="groups.create"]')), 10000);
      (await driver.findElement(By.xpath('//td[contains(.,"A_Health_Group")]')).isDisplayed()).should.equal(true);
    });

    it('Delete the Group', async function () {
      (await deleteItem('groups.create', 'A_Health_Group', 'A_Health_Group', 'groups')).should.equal(false);
    });

    afterEach(function () {
      if (this.currentTest.state === 'failed') {
        healthTestsFailed = true;
        failedHealthTestsMessage += `\n ${this.currentTest.fullTitle().replace(/ /g, '_')}`;
      }
    });

    after(async function () {
      // eslint-disable-next-line no-console
      console.log('\n\tVerifying all health artifacts are removed.');
      await removeHealthCheckArtifacts();
      // eslint-disable-next-line no-console
      console.log('\tHealth-check complete');
    });
  });

  afterEach(async function () {
    if (this.currentTest.state === 'failed') {
      await takeScreenshot(this.currentTest.fullTitle().replace(/ /g, '_'));
    }
  });

  after(function () {
    if (healthTestsFailed) {
      writeHealthCheckReport(failedHealthTestsMessage);
    } else {
      writeHealthCheckReport('All tests passed, Health-check successful');
    }
    return driver.quit();
  });
});
