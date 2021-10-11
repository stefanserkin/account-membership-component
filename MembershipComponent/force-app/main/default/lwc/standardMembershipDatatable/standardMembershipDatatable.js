import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import getStandardMemberships from '@salesforce/apex/MembershipComponentController.getStandardMemberships';

import FV_OBJECT from '@salesforce/schema/TREX1__Facility_Visit__c';
import CONTACTID_FIELD from '@salesforce/schema/TREX1__Facility_Visit__c.TREX1__Contact__c';
import MEMBERSHIPID_FIELD from '@salesforce/schema/TREX1__Facility_Visit__c.TREX1__Membership__c';
import SCAN_DT_FIELD from '@salesforce/schema/TREX1__Facility_Visit__c.TREX1__Scan_In_Time__c';

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
    { label: 'Start Date', fieldName: 'TREX1__Start_Date__c', type: "date-local" },
    { label: 'Status', fieldName: 'TREX1__Status__c' }
];

export default class StandardMembershipDatatable extends LightningElement {
    @api recordId;
    componentTitle = "Standard Mems";

    error;
    isLoading = true;

    cols = COLS;
    wiredStandardMembershipsResult;
    standardMemberships = [];

    @wire(getStandardMemberships, { accountId: '$recordId' })
    wiredStandardMemberships(result) {
        this.wiredStandardMembershipsResult = result;
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
            this.standardMemberships = parsedMemData;
            this.error = undefined;
            this.isLoading = false;
        } else if (error) {
            this.standardMemberships = undefined;
            this.error = error;
            this.isLoading = false;
        }
    }

    selectedMembership;
    selectedMembershipId;
    selectedContactId;
    fvId;

    getSelected(event) {
        const selectedRows = event.detail.selectedRows;
        this.selectedMembership = selectedRows[0];
        this.selectedMembershipId = selectedRows[0].Id;
        this.selectedContactId = selectedRows[0].TREX1__Contact__c;
    }

    handleCheckIn() {
        this.isLoading = true;
        const fields = {};
        fields[CONTACTID_FIELD.fieldApiName] = this.selectedContactId;
        fields[MEMBERSHIPID_FIELD.fieldApiName] = this.selectedMembershipId;
        let currentDateTime = new Date().toISOString();
        fields[SCAN_DT_FIELD.fieldApiName] = currentDateTime;
        const recordInput = { apiName: FV_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then((fv) => {
                this.fvId = fv.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Contact was checked in',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredStandardMembershipsResult);
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