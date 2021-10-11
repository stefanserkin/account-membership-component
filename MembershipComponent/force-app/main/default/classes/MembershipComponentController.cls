public with sharing class MembershipComponentController {

    private static Id standardMemRecTypId = Schema.SObjectType.TREX1__Membership__c
        .getRecordTypeInfosByDeveloperName().get('Standard_Membership').getRecordTypeId();
    private static Id ppMemRecTypId = Schema.SObjectType.TREX1__Membership__c
        .getRecordTypeInfosByDeveloperName().get('Punch_Pass_Membership').getRecordTypeId();

    @AuraEnabled(cacheable=true)
    public static List<TREX1__Membership__c> getStandardMemberships(Id accountId){
        return [SELECT Id, Name, TREX1__Contact__c, TREX1__Contact__r.FirstName, 
                       RecordType.Name, TREX1__End_Date__c, TREX1__Start_Date__c, 
                       TREX1__Status__c, TREX1__Type__c, TREX1__Category_Name__c
                  FROM TREX1__Membership__c 
                 WHERE TREX1__Account__c = :accountId 
                   AND RecordTypeId = :standardMemRecTypId
                  WITH SECURITY_ENFORCED];
    }

    @AuraEnabled(cacheable=true)
    public static List<TREX1__Membership__c> getPunchPassMemberships(Id accountId){
        return [SELECT Id, Name, TREX1__Contact__c, TREX1__Contact__r.FirstName, 
                       RecordType.Name, TREX1__End_Date__c, TREX1__Start_Date__c, 
                       TREX1__Status__c, TREX1__Type__c, TREX1__Category_Name__c,
                       TREX1__Stored_Value__c, TREX1__Total_Value__c, TREX1__Remaining_Value__c
                  FROM TREX1__Membership__c 
                 WHERE TREX1__Account__c = :accountId 
                   AND RecordTypeId = :ppMemRecTypId
                  WITH SECURITY_ENFORCED];
    }

}