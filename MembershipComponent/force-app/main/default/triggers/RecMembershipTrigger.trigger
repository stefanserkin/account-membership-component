trigger RecMembershipTrigger on TREX1__Membership__c (before insert) {

    Id ppRecTypeId = Schema.SObjectType.TREX1__Membership__c.getRecordTypeInfosByDeveloperName()
        .get('Punch_Pass_Membership').getRecordTypeId();
    
    List<TREX1__Membership__c> ppMems = new List<TREX1__Membership__c>();
    Set<Id> setCategoryIds = new Set<Id>();
    for (TREX1__Membership__c mem : Trigger.new) {
        if (mem.RecordTypeId == ppRecTypeId) {
            setCategoryIds.add(mem.TREX1__Category_Id__c);
            ppMems.add(mem);
        }
    }

    Map<Id, TREX1__Membership_Category__c> categoryMap = 
        new Map<Id, TREX1__Membership_Category__c>([
            SELECT Id, Name
            FROM TREX1__Membership_Category__c
            WHERE Id IN :setCategoryIds
        ]);

    for (TREX1__Membership__c mem : ppMems) {
        mem.TREX1__Category_Name__c = categoryMap.get(mem.TREX1__Category_Id__c).Name;
        if (mem.TREX1__Stored_Value__c == null) {
            mem.TREX1__Stored_Value__c = 12;
        }
        if (mem.TREX1__Type__c == null) {
            mem.TREX1__Type__c = 'Adult';
        }
        if (mem.TREX1__Start_Date__c <= Date.today() &&
                (mem.TREX1__End_Date__c == null || mem.TREX1__End_Date__c >= Date.today()) &&
                mem.TREX1__Status__c != 'Active'
        ) {
            mem.TREX1__Status__c = 'Active';
        }
    }

}