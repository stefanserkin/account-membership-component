public with sharing class MembershipComponentController {

    private static Id standardMemRecTypId = Schema.SObjectType.TREX1__Membership__c
        .getRecordTypeInfosByDeveloperName().get('Standard_Membership').getRecordTypeId();
    private static Id ppMemRecTypId = Schema.SObjectType.TREX1__Membership__c
        .getRecordTypeInfosByDeveloperName().get('Punch_Pass_Membership').getRecordTypeId();

    @AuraEnabled(cacheable=true)
    public static List<TREX1__Membership__c> getStandardMemberships(Id accountId) {
        return [SELECT Id, Name, TREX1__Contact__c, TREX1__Contact__r.Name, 
                       RecordType.Name, TREX1__End_Date__c, TREX1__Start_Date__c, 
                       TREX1__Status__c, TREX1__Type__c, TREX1__Category_Name__c
                  FROM TREX1__Membership__c 
                 WHERE TREX1__Account__c = :accountId 
                   AND RecordTypeId = :standardMemRecTypId
                  WITH SECURITY_ENFORCED
                 ORDER BY TREX1__Status__c ASC, TREX1__Start_Date__c DESC];
    }

    @AuraEnabled(cacheable=true)
    public static List<TREX1__Membership__c> getPunchPassMemberships(Id accountId) {
        return [SELECT Id, Name, TREX1__Contact__c, TREX1__Contact__r.Name, 
                       RecordType.Name, TREX1__End_Date__c, TREX1__Start_Date__c, 
                       TREX1__Status__c, TREX1__Type__c, TREX1__Category_Name__c,
                       TREX1__Stored_Value__c, TREX1__Total_Value__c, TREX1__Remaining_Value__c
                  FROM TREX1__Membership__c 
                 WHERE TREX1__Account__c = :accountId 
                   AND RecordTypeId = :ppMemRecTypId
                  WITH SECURITY_ENFORCED
                 ORDER BY TREX1__Status__c ASC, TREX1__Contact__r.Name ASC];
    }

    @AuraEnabled(cacheable=true)
    public static List<TREX1__Scanning_Location__c> getScanningLocations() {
        return [SELECT Id, Name, TREX1__Facility__c
                  FROM TREX1__Scanning_Location__c
                  WITH SECURITY_ENFORCED
                 LIMIT 10000];
    }

    @AuraEnabled
    public static List<TREX1__Facility_Visit__c> checkInMemberships(
        List<TREX1__Membership__c> memList,
        Id scanningLocation
    ) {
        List<TREX1__Facility_Visit__c> lstFVs = new List<TREX1__Facility_Visit__c>();
        for (TREX1__Membership__c mem : memList) {
            lstFVs.add(
                new TREX1__Facility_Visit__c(
                    TREX1__Contact__c = mem.TREX1__Contact__c,
                    TREX1__Contact_Name__c = mem.TREX1__Contact__r.Name,
                    TREX1__Membership__c = mem.Id,
                    TREX1__Scan_In_Time__c = Datetime.now(),
                    TREX1__Entry_Scanning_Location__c = scanningLocation
                )
            );
        }

        try {
            insert lstFVs;
            return lstFVs;
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }

    }

    @AuraEnabled
    public static List<String> createPassDecrements(
        List<TREX1__Membership__c> memList,
        Id scanningLocation
    ){
        List<String> lstEmptyMemIds = new List<String>();
        List<TREX1__Pass_Decrement__c> lstDecrements = new List<TREX1__Pass_Decrement__c>();
        List<TREX1__Facility_Visit__c> lstFVs        = new List<TREX1__Facility_Visit__c>();
        for (TREX1__Membership__c mem : memList) {
            if (mem.TREX1__Remaining_Value__c <= 0) {
                lstEmptyMemIds.add(mem.Id);
                continue;
            }
            lstFVs.add(
                new TREX1__Facility_Visit__c(
                    TREX1__Contact__c = mem.TREX1__Contact__c,
                    TREX1__Contact_Name__c = mem.TREX1__Contact__r.Name,
                    TREX1__Credits_Used__c = 1,
                    TREX1__Membership__c = mem.Id,
                    TREX1__Scan_In_Time__c = Datetime.now(),
                    TREX1__Entry_Scanning_Location__c = scanningLocation
                )
            );
        }

        if (!lstFVs.isEmpty()) {
            insert lstFVs;
        }

        for (TREX1__Facility_Visit__c fv : lstFVs) {
            lstDecrements.add(
                new TREX1__Pass_Decrement__c(
                    TREX1__Membership_Punch_Pass_Decrement__c = fv.TREX1__Membership__c,
                    TREX1__Value__c = 1,
                    TREX1__Date__c = Datetime.now(),
                    TREX1__Facility_Visit__c = fv.Id
                )
            );
        }

        try {
            insert lstDecrements;
            return lstEmptyMemIds;
        } catch(Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
        
    }

}