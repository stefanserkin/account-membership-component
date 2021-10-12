import { LightningElement, api, wire } from 'lwc';
import getScanningLocations from '@salesforce/apex/MembershipComponentController.getScanningLocations';

export default class AccountMembershipComponent extends LightningElement {
    @api recordId;
    membershipTitle = 'Memberships';
    punchPassTitle = 'Punch Passes';

    // SCANNING LOCATIONS
    wiredLocationsResult;
    locations = [];

    locationOptions = [];
    locationChoice = '';
    selectedLocation = '';
    selectedLocationName = '';

    @wire(getScanningLocations)
    wiredLocations(result) {
        this.wiredLocationsResult = result;
        const { data, error } = result;
        if (data) {
            this.locations = data;
            console.table(this.locations);
            console.table(this.locationOptions);
            
            for (let i = 0; i < data.length; i++) {
                this.locationOptions = [...this.locationOptions, {value: data[i].Id, label: data[i].Name} ];
            }
            
            this.error = undefined;
            this.isLoading = false;
        } else if (error) {
            this.locaions = undefined;
            this.error = error;
            this.isLoading = false;
        }
    }

    get locationOptionValues() {
        return this.locationOptions;
    }

    get checkInLabel() {
        return `Check In to ${this.selectedLocationName}`;
    }

    // HANDLE COMBOBOX CHANGE
    handleLocationChange(event) {
        const selectedOption = event.detail.value;
        console.log('::::::::: selected value: ' + selectedOption);
        this.selectedLocation = selectedOption;
    }

    // COMBOBOX VALUE
    get selectedLocationValue() {
        return this.selectedLocation;
    }
}