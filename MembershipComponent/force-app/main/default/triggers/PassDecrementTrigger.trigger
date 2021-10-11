trigger PassDecrementTrigger on TREX1__Pass_Decrement__c (after insert) {

    Id ppMemRecTypId = Schema.SObjectType.TREX1__Membership__c
        .getRecordTypeInfosByDeveloperName().get('Punch_Pass_Membership').getRecordTypeId();

    List<TREX1__Membership__c> completedMems = new List<TREX1__Membership__c>();

    Set<Id> memIds = new Set<Id>();
    for (TREX1__Pass_Decrement__c pd : Trigger.new) {
        memIds.add(pd.TREX1__Membership_Punch_Pass_Decrement__c);
    }

    Map<Id, TREX1__Membership__c> mapMemsWithPDs = new Map<Id, TREX1__Membership__c>([
        SELECT Id, TREX1__Stored_Value__c, TREX1__Total_Value__c, 
               TREX1__Remaining_Value__c, TREX1__Status__c,
               (SELECT Id, TREX1__Value__c FROM TREX1__Pass_Decrements__r)
          FROM TREX1__Membership__c 
         WHERE Id IN :memIds
    ]);

    for (TREX1__Membership__c mem : mapMemsWithPDs.values()) {
        Decimal pointsUsed = 0;
        for (TREX1__Pass_Decrement__c pd : mem.TREX1__Pass_Decrements__r) {
            pointsUsed += pd.TREX1__Value__c;
        }
        if (mem.TREX1__Stored_Value__c <= pointsUsed) {
            mem.TREX1__Status__c = 'Complete';
            completedMems.add(mem);
        }
    }

    update completedMems;

}