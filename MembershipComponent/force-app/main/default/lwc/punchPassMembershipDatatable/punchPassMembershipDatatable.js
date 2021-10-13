import { LightningElement, api, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import getPunchPassMemberships from '@salesforce/apex/MembershipComponentController.getPunchPassMemberships';
import createPassDecrements from '@salesforce/apex/MembershipComponentController.createPassDecrements';

const COLS = [
    { label: 'Membership Name', fieldName: 'memUrl', type: 'url', initialWidth: 110, typeAttributes: {
        label: { fieldName: 'Name' }
        }, sortable: true
    },
    { label: 'Contact', fieldName: 'contactUrl', type: 'url', initialWidth: 140, typeAttributes: {
        label: { fieldName: 'contactName' }
        }, sortable: true 
    },
    { label: 'Membership Category', fieldName: 'TREX1__Category_Name__c' },
    { label: 'Status', fieldName: 'TREX1__Status__c', initialWidth: 105, cellAttributes: { 
        class:{fieldName:'typeColor'},
        iconName: { 
            fieldName: 'statusIcon' 
        },
        iconPosition: 'left', 
        iconAlternativeText: 'Active Pass'
    }},
    { label: 'Quantity', fieldName: 'TREX1__Stored_Value__c', type: 'number', initialWidth: 100 },
    { label: 'Used', fieldName: 'TREX1__Total_Value__c', type: 'number', initialWidth: 80 },
    { label: 'Remaining', fieldName: 'TREX1__Remaining_Value__c', type: 'number', initialWidth: 110 }
];

export default class StandardMembershipDatatable extends LightningElement {
    @api recordId;
    @api cardTitle;
    @api locationId;

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
                let statusIcon;
                let typeColor;
                memUrl = `/${row.Id}`;
                contactUrl = `/${row.TREX1__Contact__c}`;
                if (row.TREX1__Stored_Value__c > row.TREX1__Total_Value__c) {
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
            this.punchPasses = parsedMemData;
            this.error = undefined;
            this.isLoading = false;
        } else if (error) {
            this.punchPasses = undefined;
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

    handleDecrement() {
        if (!this.locationId) {
            alert(`Please select a location to check the Contact into`);
            return;
        }
        if (this.selectedMemberships.length == 0) {
            alert(`Please select a membership to check in`);
            return;
        }

        this.isLoading = true;
        
        createPassDecrements({memList : this.selectedMemberships, scanningLocation : this.locationId})
            .then((emptyMemIds) => {
                console.log(emptyMemIds);
                const emptyMemIdArray = emptyMemIds;
                var toastMessage;
                var toastVariant;
                var toastTitle;
                if (emptyMemIdArray.length > 0) {
                    toastMessage = 'One or more passes were empty and could not be decremented:';
                    console.log(toastMessage);
                    for (let i = 0; i < emptyMemIdArray.length; i++) {
                        if (i > 0) {
                            toastMessage += ',';
                        }
                        toastMessage += ' ' + emptyMemIdArray[i];
                        console.log(toastMessage);
                    }
                    toastVariant = 'warning';
                    toastTitle = 'Cannot Decrement Empty Pass';
                } else {
                    toastMessage = 'Contacts were checked in and membership passes were decremented';
                    toastVariant = 'success';
                    toastTitle = 'Success!';
                }

                const toastEvent = new ShowToastEvent({
                    title: toastTitle,
                    message: toastMessage,
                    variant: toastVariant
                });
                this.dispatchEvent(toastEvent);
                this.isLoading = false;
                return refreshApex(this.wiredPunchPassesResult);
            })
            .catch(error =>{
                this.error = error;
                this.isLoading = false;
                window.console.log('Unable to create the records due to ' + JSON.stringify(this.error));
            });
    }

}