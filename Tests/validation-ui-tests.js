﻿/// <reference path="jquery-1.7.1.js" />
/// <reference path="../Lib/knockout-latest.debug.js" />
/// <reference path="../Src/knockout.validation.js" />
/// <reference path="Qunit/qunit.js" />

module('UI Tests', {
    setup: function () {

    },
    teardown: function () {
        ko.cleanNode($('#testContainer')[0]);
        $('#testContainer').empty();
    }
});

//utility functions
var applyTestBindings = function (vm) {
    ko.applyBindingsWithValidation(vm, $('#testContainer')[0]);
};

var addTestHtml = function(html){
    $('#testContainer').html(html);
};

test('hasAttribute works in old IE', function () {
    
    addTestHtml('<input id="myTestInput" type="text" required />');

    var el = document.getElementById('myTestInput');

    ok(el, 'found element');

    ok(ko.validation.utils.hasAttribute(el, 'required'), 'element correctly has html5 input attribute');
    ok(!ko.validation.utils.hasAttribute(el, 'pattern'), 'element correctly does not have html5 input attribute');
});

//#region Inserting Messages

test('Inserting Messages Works', function () {

    addTestHtml('<input id="myTestInput" data-bind="value: firstName" type="text" />');

    var vm = {
        firstName: ko.observable('').extend({ required: true })
    };

    applyTestBindings(vm);

    var $testInput = $('#myTestInput');

    $testInput.val("a"); //set it 
    $testInput.change(); //trigger change event

    $testInput.val(""); //set it 
    $testInput.change(); //trigger change event

    var isValid = vm.firstName.isValid();

    ok(!isValid, 'First Name is NOT Valid');

    var msg = $testInput.siblings().first().text();

    equals(msg, 'This field is required.', msg);
});

//#endregion

//#region Validation Option Tests

test('Validation Options - Basic Tests', function () {

    var testHtml = '<div data-bind="validationOptions: { insertMessages: false }"><input type="text" id="myTestInput" data-bind="value: firstName" /></div>';

    addTestHtml(testHtml);

    var vm = {
        firstName: ko.observable('').extend({ required: true })
    };

    applyTestBindings(vm);

    var $testInput = $('#myTestInput');

    $testInput.val("a"); //set it 
    $testInput.change(); //trigger change event

    $testInput.val(""); //set it 
    $testInput.change(); //trigger change event

    var isValid = vm.firstName.isValid();

    ok(!isValid, 'First Name is NOT Valid');

    var noMsgs = $testInput.siblings().length;

    equals(noMsgs, 0, 'No Messages were inserted');

});

test('Validation Options - Nested Test', function () {

    var testHtml = '<div data-bind="validationOptions: { insertMessages: false }">' +
                        '<input type="text" id="myTestInput" data-bind="value: firstName" />' +
                        '<div data-bind="with: someObj">' +
                            '<input id="myLastName" type="text" data-bind="value: lastName" />' +
                        '</div>' +
                    '</div>';

    addTestHtml(testHtml);

    var vm = {
        firstName: ko.observable('').extend({ required: true }),
        someObj: {
            lastName: ko.observable().extend({ minLength : 2 })
        }
    };

    applyTestBindings(vm);

    var $testInput = $('#myLastName');

    $testInput.val("a"); //set it 
    $testInput.change(); //trigger change event

    var isValid = vm.someObj.lastName.isValid();

    ok(!isValid, 'Last Name is NOT Valid');

    var noMsgs = $testInput.siblings().length;

    equals(noMsgs, 0, 'No Messages were inserted');

});

test('Validation Options - Options only apply to their HTML Contexts', function () {

    var testHtml = '<div >' +
                        '<div data-bind="validationOptions: { insertMessages: false }">' +
                            '<div data-bind="with: someObj">' +
                                '<input id="myLastName" type="text" data-bind="value: lastName" />' +
                            '</div>' +
                        '</div>' +
                        '<input type="text" id="myFirstName" data-bind="value: firstName" />' +
                    '</div>';

    addTestHtml(testHtml);

    var vm = {
        firstName: ko.observable('a').extend({ required: true }),
        someObj: {
            lastName: ko.observable().extend({ minLength: 2 })
        }
    };

    applyTestBindings(vm);

    var $testInput = $('#myLastName');

    $testInput.val("a"); //set it 
    $testInput.change(); //trigger change event

    var isValid = vm.someObj.lastName.isValid();

    ok(!isValid, 'Last Name is NOT Valid');

    var noMsgs = $testInput.siblings().length;

    equals(noMsgs, 0, 'No Messages were inserted');

    var $firstName = $('#myFirstName');
    $firstName.val(""); //set it 
    $firstName.change(); //trigger change event

    ok(!vm.firstName.isValid(), 'Validation Still works correctly');

    var insertMsgCt = $firstName.siblings('span').length;
    equals(insertMsgCt, 1, 'Should have inserted 1 message beside the first name!');

});

test("Issue #43 & #47 - Error messages are not switched correctly", function () {
    var vm = {
        testObj: ko.observable().extend({ min: 1, max: 100 }),
        dummyProp: ko.observable().extend({ required: true })
    };

    vm.errors = ko.validation.group(vm);

    // setup the html
    addTestHtml('<span id="testMessage" data-bind="validationMessage: testObj"></span>');
    applyTestBindings(vm);

    var $msg = $('#testMessage');

    vm.testObj(-1); // should invalidate the min rule

    ok(!vm.testObj.isValid(), vm.testObj.error);
    equals(vm.testObj.error, $msg.text(), "Min rule was correctly triggered");

    vm.testObj(101); // should invalidate the max rule

    ok(!vm.testObj.isValid(), vm.testObj.error);
    equals(vm.testObj.error, $msg.text(), "Max rule was correctly triggered");
});

test("Issue #44 - Validation Element - Is Valid Test", function () {
    var vm = {
        testObj: ko.observable().extend({ min: 1, max: 100 })
    };

    // setup the html
    addTestHtml('<input type="text" id="testElement" data-bind="value: testObj, validationElement: testObj"/>');

    // make sure we allow element decorations
    ko.validation.init({ decorateElement: true }, true);

    applyTestBindings(vm);

    var $el = $('#testElement');
    ok(!$el.hasClass('validationElement'), 'Does not have the validation class');

    vm.testObj(2); // should validate the min rule

    ok(vm.testObj.isValid(), "Object is valid");
    ok(!$el.hasClass('validationElement'), 'Correctly does not have the validation class');

});

test("Issue #44 - Validation Element - Is Invalid Test", function () {
    var vm = {
        testObj: ko.observable().extend({ min: 1, max: 100 })
    };

    // setup the html
    addTestHtml('<input type="text" id="testElement" data-bind="value: testObj, validationElement: testObj"/>');

    // make sure we allow element decorations
    ko.validation.init({ decorateElement: true }, true);

    applyTestBindings(vm);

    var $el = $('#testElement');
    ok(!$el.hasClass('validationElement'), 'Does not have the validation class');

    vm.testObj(-1); // should invalidate the min rule

    ok(!vm.testObj.isValid(), "Object is not valid");
    ok($el.hasClass('validationElement'), 'Correctly does have the validation class');

});
//#endregion