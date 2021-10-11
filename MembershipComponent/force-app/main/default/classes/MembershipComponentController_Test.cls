@isTest
public class MembershipComponentController_Test {
    private static Id hhRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByDeveloperName().get('HH_Account').getRecordTypeId();
    private static Id standardMemRecTypeId = Schema.SObjectType.TREX1__Membership__c.getRecordTypeInfosByDeveloperName().get('Standard_Membership').getRecordTypeId();

    @isTest
    static void testGetStandardMemberships() {

        Account acc = new Account(RecordTypeId=hhRecTypeId, Name='Test Household');
        insert acc;

        Contact ct = new Contact(AccountId=acc.Id, FirstName='Person', LastName='Test');
        insert ct;

        TREX1__Membership__c mem = new TREX1__Membership__c(TREX1__Contact__c=ct.Id, TREX1__Account__c=acc.Id, RecordTypeId=standardMemRecTypeId, TREX1__Start_Date__c=Date.today().addDays(-1));
        insert mem;

        Test.startTest();
        List<TREX1__Membership__c> lstMems = MembershipComponentController.getStandardMemberships(acc.Id);
        Test.stopTest();

        System.assertEquals(1, lstMems.size(), 'Unexpected amount of memberships returned');
    }
}
