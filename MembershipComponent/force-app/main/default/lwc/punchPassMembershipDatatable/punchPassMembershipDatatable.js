import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getPunchPassMemberships from '@salesforce/apex/MembershipComponentController.getPunchPassMemberships';

import DECREMENT_OBJECT from '@salesforce/schema/TREX1__Pass_Decrement__c';
import VALUE_FIELD from '@salesforce/schema/TREX1__Pass_Decrement__c.TREX1__Value__c';
import DATE_FIELD from '@salesforce/schema/TREX1__Pass_Decrement__c.TREX1__Date__c';
import MEMBERSHIPID_FIELD from '@salesforce/schema/TREX1__Pass_Decrement__c.TREX1__Membership_Punch_Pass_Decrement__c';

const COLS = [
    { label: 'Membership Name', fieldName: 'memUrl', type: 'url', typeAttributes: {
        label: { fieldName: 'Name' },
        target: '_blank'
        }, sortable: true 
    },
    { label: 'Contact', fieldName: 'contactUrl', type: 'url', typeAttributes: {
        label: { fieldName: 'contactName' },
        target: '_blank'
        }, sortable: true 
    },
    { label: 'Membership Category', fieldName: 'TREX1__Category_Name__c' },
    { label: 'Status', fieldName: 'TREX1__Status__c' },
    { label: 'Total Credits', fieldName: 'TREX1__Stored_Value__c', type: 'number' },
    { label: 'Credits Used', fieldName: 'TREX1__Total_Value__c', type: 'number' },
    { label: 'Remaining Credits', fieldName: 'TREX1__Remaining_Value__c', type: 'number' }
];

export default class StandardMembershipDatatable extends LightningElement {
    @api recordId;
    componentTitle = "Account Punch Passes";

    error;
    isLoading = true;

    cols = COLS;
    wiredPunchPassesResult;
    punchPasses = [];

    @wire(getPunchPassMemberships, { accountId: '$recordId' })
    wiredPunchPassMemberships(result) {
        this.wiredPunchPassesResult = result;
        const { data, error } = result;
        if (data) {
            let memUrl;
            let contactUrl;
            let parsedMemData = JSON.parse(JSON.stringify(result.data));
            parsedMemData = parsedMemData.map(row => {
                memUrl = `/${row.Id}`;
                contactUrl = `/${row.TREX1__Contact__c}`;
                return {...row, 
                    contactName: row.TREX1__Contact__r.FirstName,
                    contactUrl,
                    memUrl,
                }
            })
            this.punchPasses = parsedMemData;
            this.error = undefined;
            this.isLoading = false;
        } else if (error) {
            this.punchPasses = undefined;
            this.error = error;
            this.isLoading = false;
        }
    }

    selectedMembership;
    selectedMembershipId;
    selectedContactId;
    decrementId;

    getSelected(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedMembership = selectedRows[0];
        this.selectedMembershipId = selectedRows[0].Id;
        this.selectedContactId = selectedRows[0].TREX1__Contact__c;
    }

    handleDecrement() {
        this.isLoading = true;
        const fields = {};
        fields[VALUE_FIELD.fieldApiName] = 1;
        fields[MEMBERSHIPID_FIELD.fieldApiName] = this.selectedMembershipId;
        let currentDateTime = new Date().toISOString();
        fields[DATE_FIELD.fieldApiName] = currentDateTime;
        const recordInput = { apiName: DECREMENT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then((decrement) => {
                this.decrementId = decrement.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Contact was checked in',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredPunchPassesResult);
                this.isLoading = false;
            })
            .catch((error) => {
                this.error = error;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Check In Unsuccessful',
                        message: 'Failed to check in contact',
                        variant: 'error'
                    })
                );
                this.isLoading = false;
            })
    }

}