import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getStandardMemberships from '@salesforce/apex/MembershipComponentController.getStandardMemberships';
import getScanningLocations from '@salesforce/apex/MembershipComponentController.getScanningLocations';
import checkInMemberships from '@salesforce/apex/MembershipComponentController.checkInMemberships';

const COLS = [
    { label: 'Membership Name', fieldName: 'memUrl', type: 'url', typeAttributes: {
        label: { fieldName: 'Name' }
        }, sortable: true 
    },
    { label: 'Contact', fieldName: 'contactUrl', type: 'url', typeAttributes: {
        label: { fieldName: 'contactName' }
        }, sortable: true 
    },
    { label: 'Membership Category', fieldName: 'TREX1__Category_Name__c' },
    { label: 'Status', fieldName: 'TREX1__Status__c', cellAttributes: {
        class:{fieldName:'typeColor'},
        iconName: { 
            fieldName: 'statusIcon' 
        },
        iconPosition: 'left', 
        iconAlternativeText: 'Active Membership'
    }},
    { label: 'Start Date', fieldName: 'TREX1__Start_Date__c', type: "date-local" },
    { label: 'End Date', fieldName: 'TREX1__End_Date__c', type: "date-local" }
];

export default class StandardMembershipDatatable extends LightningElement {
    @api recordId;
    @api cardTitle;
    @api locationId;

    error;
    isLoading = true;

    // MEMBERSHIPS
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
                let statusIcon;
                let typeColor;
                memUrl = `/${row.Id}`;
                contactUrl = `/${row.TREX1__Contact__c}`;
                if (row.TREX1__Status__c == 'Active') {
                    statusIcon = 'utility:success';
                    typeColor = 'slds-text-color_success';
                }
                return {...row, 
                    'contactName':row.TREX1__Contact__r.Name,
                    'contactUrl':contactUrl,
                    'memUrl':memUrl,
                    'statusIcon':statusIcon,
                    'typeColor':typeColor
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

    selectedMemberships = [];

    getSelected(event) {
        let selectedRows = event.detail.selectedRows;
        if (this.selectedMemberships.length > 0) {
            let selectedIds = selectedRows.map(row => row.Id);
            let unselectedRows = this.selectedMemberships.filter(row => !selectedIds.includes(row.Id));
            console.log(unselectedRows);
        }
        this.selectedMemberships = selectedRows;
        console.table(this.selectedMemberships);
    }

    // FACILITY VISIT DML
    handleCheckIn() {
        if (!this.locationId) {
            alert(`Please select a location to check the Contact into`);
            return;
        }
        if (this.selectedMemberships.length == 0) {
            alert(`Please select a membership to check in`);
            return;
        }

        this.isLoading = true;

        checkInMemberships({memList: this.selectedMemberships, scanningLocation: this.locationId})
            .then((fvs) => {
                console.table(fvs);
                const toastEvent = new ShowToastEvent({
                    title: 'Success!',
                    message: 'Contacts were successully checked in',
                    variant: 'success'
                });
                this.dispatchEvent(toastEvent);
                this.isLoading = false;
                return refreshApex(this.wiredStandardMembershipsResult);
            })
            .error((error) => {
                this.error = error;
                window.console.log('Unable to create the records due to ' + JSON.stringify(this.error));
                const toastEvent = new ShowToastEvent({
                    title: 'Something went wrong...',
                    message: 'Unable to check in contacts',
                    variant: 'error'
                });
                this.dispatchEvent(toastEvent);
                this.isLoading = false;
                return refreshApex(this.wiredStandardMembershipsResult);
            })
    }

}