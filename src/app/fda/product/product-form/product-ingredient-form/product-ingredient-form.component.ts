import { Component, OnInit, Input, AfterViewInit, OnDestroy } from '@angular/core';
import { ViewEncapsulation, Output, EventEmitter, ViewChildren, QueryList } from '@angular/core';
import { ProductService } from '../../service/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingService } from '@gsrs-core/loading';
import { MainNotificationService } from '@gsrs-core/main-notification';
import { AppNotification, NotificationType } from '@gsrs-core/main-notification';
import { GoogleAnalyticsService } from '@gsrs-core/google-analytics';
import { UtilsService } from '@gsrs-core/utils/utils.service';
import { AuthService } from '@gsrs-core/auth/auth.service';
import { ControlledVocabularyService } from '@gsrs-core/controlled-vocabulary/controlled-vocabulary.service';
import { VocabularyTerm } from '@gsrs-core/controlled-vocabulary/vocabulary.model';
import { ProductIngredient, ValidationMessage } from '../../model/product.model';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { OverlayContainer } from '@angular/cdk/overlay';
import { JsonDialogFdaComponent } from '../../../json-dialog-fda/json-dialog-fda.component';
import { ConfirmDialogComponent } from '../../../confirm-dialog/confirm-dialog.component';
import { SubstanceSearchSelectorComponent } from '../../../substance-search-select/substance-search-selector.component';
import { SubstanceRelated, SubstanceSummary } from '@gsrs-core/substance';
import { GeneralService } from '../../../service/general.service';
import { ConfigService } from '@gsrs-core/config/config.service';

@Component({
  selector: 'app-product-ingredient-form',
  templateUrl: './product-ingredient-form.component.html',
  styleUrls: ['./product-ingredient-form.component.scss']
})
export class ProductIngredientFormComponent implements OnInit {

  @ViewChildren('checkBox') checkBox: QueryList<any>;
  @Input() ingredient: ProductIngredient;
  @Input() totalIngredient: number;
  @Input() prodIngredientIndex: number;
  @Input() prodComponentIndex: number;
  @Input() prodLotIndex: number;

  username = null;
  searchValue: string;

  ingredientNameSubstanceUuid: string;
  ingredientName: string;
  basisOfStrengthSubstanceUuid: string;
  basisOfStrengthIngredientName: string;

  substanceKeyOld: string;
  basisofStrengthSubstanceKeyOld: string;

  ingredientNameMessage = '';
  basisOfStrengthMessage = '';
  newRecordMessage = '';
  substanceKeyTypeConfig = '';

  relationship: any;
  ingredientNameActiveMoiety = new Array<String>();
  basisOfStrengthActiveMoiety = new Array<String>();
  selectedIngredientLocation = new Array<any>();
  subscriptions: Array<Subscription> = [];

  locationList: Array<any> = [
    { value: 'Whole', checked: false },
    { value: 'Core', checked: false },
    { value: 'Coating', checked: false },
    { value: 'Other', checked: false }
  ];

  constructor(
    public generalService: GeneralService,
    private productService: ProductService,
    public cvService: ControlledVocabularyService,
    private authService: AuthService,
    private configService: ConfigService,
    private dialog: MatDialog) { }

  ngOnInit() {
    setTimeout(() => {

      //****************************************************************************
      // CONFIG: GET SUBSTANCE KEY TYPE,  (PRODUCT)
      //****************************************************************************
      // Get Substance Linking Key Type from Config for PRODUCT
      this.substanceKeyTypeConfig = this.generalService.getSubstanceKeyTypeForProductConfig();
      if (!this.substanceKeyTypeConfig) {
        alert('There is no Substance configuration found in frontend config file: substance.linking.keyType.productKeyType. Unable to add Ingredient Name when saving this record.');
      }

      this.username = this.authService.getUser();

      this.loadIngredientLocation();

      this.substanceKeyOld = this.ingredient.substanceKey;
      this.basisofStrengthSubstanceKeyOld = this.ingredient.basisOfStrengthSubstanceKey;

      // When the page is loaded, for existing product record, display structure based on substance key
      this.getSubstanceBySubstanceKey();
    }, 600);
  }

  loadIngredientLocation() {
    if ((this.ingredient.ingredientLocation) && (this.ingredient.ingredientLocation.length > 0)) {
      const arrLoc = this.ingredient.ingredientLocation.split(',');
      for (let i = 0; i < this.locationList.length; i++) {
        for (let j = 0; j < arrLoc.length; j++) {
          if (this.locationList[i].value === arrLoc[j]) {
            this.locationList[i].checked = true;
          }
        }
      }
    }
  }

  setSelectedIngredientLocation(data: any, checkbox) {
    let selStr = '';
    const selected = [];
    const checked = this.checkBox.filter(checkbox1 => checkbox1.checked);
    checked.forEach(data1 => {
      selected.push(data1.value);
    });
    if (selected.length > 0) {
      selStr = selected.join(',');
      this.ingredient.ingredientLocation = selStr;
    }
  }

  confirmDeleteProductIngredient(prodComponentIndex: number, prodLotIndex: number, prodIngredientIndex: number) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Are you sure you want to delete Product Ingredient Details ' + (prodIngredientIndex + 1) + ' data?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result === true) {
        this.deleteProductIngredient(prodComponentIndex, prodLotIndex, prodIngredientIndex);
      }
    });
  }

  deleteProductIngredient(prodComponentIndex: number, prodLotIndex: number, prodIngredientIndex: number) {
    this.productService.deleteProductIngredient(prodComponentIndex, prodLotIndex, prodIngredientIndex);
  }

  copyProductIngredient() {
    this.productService.copyProductIngredient(this.ingredient, this.prodComponentIndex, this.prodLotIndex);
  }

  confirmDeleteIngredientName() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Are you sure you want to delete Ingredient Name ' + (this.prodIngredientIndex + 1) + '?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result === true) {
        this.deleteIngredientName();
      }
    });
  }

  deleteIngredientName() {
    this.ingredientNameMessage = '';
    if (this.ingredient.id != null) {
      // Display this message if deleting existing Ingredient Name which is in database.
      if (this.substanceKeyOld != null) {
        this.ingredientNameMessage = 'Click Validate and Submit button to delete ' + this.ingredientName;
      }
    }
    this.ingredientNameSubstanceUuid = null;
    this.ingredientName = null;
    this.ingredient.substanceKey = null;
    this.ingredient.substanceKeyType = null;
  }

  confirmDeleteBasisOfStrength() {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Are you sure you want to delete Basis of Strength ' + (this.prodIngredientIndex + 1) + '?' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result === true) {
        this.deleteBasisOfStrength();
      }
    });
  }

  deleteBasisOfStrength() {
    this.basisOfStrengthMessage = '';
    if (this.ingredient.id != null) {
      // Display this message if deleting existing Basis of Strength which is in database.
      if (this.basisofStrengthSubstanceKeyOld != null) {
        this.basisOfStrengthMessage = 'Click Validate and Submit button to delete ' + this.basisOfStrengthIngredientName;
      }
    }
    this.basisOfStrengthSubstanceUuid = null;
    this.basisOfStrengthIngredientName = null;
    this.ingredient.basisOfStrengthSubstanceKey = null;
    this.ingredient.basisOfStrengthSubstanceKeyType = null;
  }

  ingredientNameUpdated(substance: SubstanceSummary): void {
    this.ingredientNameMessage = '';

    if (substance != null) {
      const relatedSubstance: SubstanceRelated = {
        refPname: substance._name,
        name: substance._name,
        refuuid: substance.uuid,
        substanceClass: 'reference',
        approvalID: substance.approvalID
      };

      if (relatedSubstance != null) {
        if (relatedSubstance.refuuid != null) {

          // set substance uuid for the releated subtance structure
          this.ingredientNameSubstanceUuid = relatedSubstance.refuuid;

          // Clear the Validation Message
          this.ingredientNameMessage = '';
          this.ingredientNameActiveMoiety.length = 0;

          this.ingredientNameMessage = '';
          this.ingredient.$$ingredientNameValidation = '';

          /**************************************************** */
          /* SUBSTANCE KEY RESOLVER BEGIN                       */
          /**************************************************** */
          if (!this.substanceKeyTypeConfig) {
            alert('There is no Substance configuration found in frontend config file: substance.linking.keyType.productKeyType. Unable to add Ingredient Name when saving this record.');
            this.ingredientNameMessage = 'Add Substance Key Type in Config';
          } else {
            //this.testing(this.ingredient.substanceKey, relatedSubstance);
            // KEY RESOLVER
            if (this.substanceKeyTypeConfig === 'UUID' || this.substanceKeyTypeConfig === 'APPROVAL_ID') {
              this.ingredient.substanceKey = this.generalService.getSubstanceKeyBySubstanceKeyTypeResolver(relatedSubstance, this.substanceKeyTypeConfig);
            } else if (this.substanceKeyTypeConfig === 'BDNUM') {
              this.generalService.getCodeBdnumBySubstanceUuid(relatedSubstance.refuuid).subscribe(response => {
                this.ingredient.substanceKey = response;

                // Populate Basis of Strength if it is empty/null, same as Ingredient Name
                if (!this.ingredient.basisOfStrengthSubstanceKey) {
                  this.ingredient.basisOfStrengthSubstanceKey = this.ingredient.substanceKey;
                }
              });
            }
            this.ingredient.substanceKeyType = this.substanceKeyTypeConfig;
          }
          // ******** SUBSTANCE KEY RESOLVER END *************


          // Populate Basis of Strength if it is empty/null, same as Ingredient Name
          if (!this.ingredient.basisOfStrengthSubstanceKey) {

            // Clear the Validation Message
            this.basisOfStrengthMessage = '';
            this.ingredient.$$basisOfStrengthValidation = '';

            this.ingredient.basisOfStrengthSubstanceKey = this.ingredient.substanceKey;
            this.ingredient.basisOfStrengthSubstanceKeyType = this.ingredient.substanceKeyType;

            // set substance uuid for the basis of strength releated subtance structure
            this.basisOfStrengthSubstanceUuid = this.ingredientNameSubstanceUuid;

            //this.basisOfStrengthIngredientName = relatedSubstance.name;
            //this.basisOfStrengthSubstanceUuid = relatedSubstance.refuuid;
            // Get Active Moiety
            //this.getActiveMoiety(this.basisOfStrengthSubstanceUuid, 'basisofstrength');
          }


          /*
         // Substance Key Type fOUND in frontend config
         // If Substance Key Type found in the frontend config, set value of this Ingredient Substance Key Type
         this.ingredient.substanceKeyType = this.substanceKeyTypeConfig;

         // If Substance Key Type is UUID in the frontend config, set value of this Ingredient Substance Key to Substance Uuid
         if (this.substanceKeyTypeConfig === 'UUID') {
           this.ingredient.substanceKey = relatedSubstance.refuuid;
         // If Substance Key Type is APPROVAL_ID in the frontend config, set value of this Ingredient Substance Key to Substance Approval ID
         } else if (this.substanceKeyTypeConfig === 'APPROVAL_ID') {
           this.ingredient.substanceKey = relatedSubstance.approvalID;
           // If Substance Key Type is BDNUM in the frontend config, set value of this Ingredient Substance Key to Substance Key/Bdnum/Code
         } else if (this.substanceKeyTypeConfig === 'BDNUM') {
           // Get the Bdnum/code from Substance by substance uuid
           this.generalService.getCodeBdnumBySubstanceUuid(relatedSubstance.refuuid).subscribe(response => {
             if (response) {
               this.ingredient.substanceKey = response;
             }
           });
         }
         */


          /*
          this.getSubstanceCode(relatedSubstance.refuuid, 'ingredientname');

          this.substanceUuid = relatedSubstance.refuuid;
          this.ingredientName = relatedSubstance.name;

          // Clear the Validation Message
          this.ingredientNameMessage = '';
          this.ingredient.$$ingredientNameValidation = '';

          // Populate Basis of Strength if it is empty/null
          if (!this.ingredient.basisOfStrengthSubstanceKey) {

            // Clear the Validation Message
            this.basisOfStrengthMessage = '';
            this.ingredient.$$basisOfStrengthValidation = '';

            this.basisOfStrengthIngredientName = relatedSubstance.name;
            this.basisOfStrengthSubstanceUuid = relatedSubstance.refuuid;
            // Get Active Moiety
            this.getActiveMoiety(this.basisOfStrengthSubstanceUuid, 'basisofstrength');
          }

          // Get Active Moiety
          this.getActiveMoiety(this.substanceUuid, 'ingredientname');
          */
          //}
        }
      }
      // else substance is null
    } else {
      this.ingredient.substanceKey = "";
      this.ingredient.substanceKeyType = "";
      this.ingredientNameSubstanceUuid = "";
    }
  }

  testing(var1: string, relatedSubstance: SubstanceRelated) {
    // KEY RESOLVER
    if (this.substanceKeyTypeConfig === 'UUID' || this.substanceKeyTypeConfig === 'APPROVAL_ID') {
      var1 = this.generalService.getSubstanceKeyBySubstanceKeyTypeResolver(relatedSubstance, this.substanceKeyTypeConfig);
    } else if (this.substanceKeyTypeConfig === 'BDNUM') {
      this.generalService.getCodeBdnumBySubstanceUuid(relatedSubstance.refuuid).subscribe(response => {
        var1 = response;
      });
    }
  }

  basisOfStrengthUpdated(substance: SubstanceSummary): void {
    if (substance != null) {
      const relatedSubstance: SubstanceRelated = {
        refPname: substance._name,
        name: substance._name,
        refuuid: substance.uuid,
        substanceClass: 'reference',
        approvalID: substance.approvalID
      };

      if (relatedSubstance != null) {
        if (relatedSubstance.refuuid != null) {

          // set substance uuid for the basis of strength releated subtance structure
          this.basisOfStrengthSubstanceUuid = relatedSubstance.refuuid;

          // Clear the Validation Message
          this.basisOfStrengthMessage = '';
          this.basisOfStrengthActiveMoiety.length = 0;  // Clear Array

          // Clear the Validation Message
          this.basisOfStrengthMessage = '';
          this.ingredient.$$basisOfStrengthValidation = '';

          /**************************************************** */
          /* SUBSTANCE KEY RESOLVER BEGIN                       */
          /**************************************************** */
          if (!this.substanceKeyTypeConfig) {
            alert('There is no Substance configuration found in frontend config file: substance.linking.keyType.productKeyType. Unable to add Ingredient Name when saving this record.');
            this.ingredientNameMessage = 'Add Substance Key Type in Config';
          } else {
            // KEY RESOLVER
            if (this.substanceKeyTypeConfig === 'UUID' || this.substanceKeyTypeConfig === 'APPROVAL_ID') {
              this.ingredient.basisOfStrengthSubstanceKey = this.generalService.getSubstanceKeyBySubstanceKeyTypeResolver(relatedSubstance, this.substanceKeyTypeConfig);
            } else if (this.substanceKeyTypeConfig === 'BDNUM') {
              this.generalService.getCodeBdnumBySubstanceUuid(relatedSubstance.refuuid).subscribe(response => {
                this.ingredient.basisOfStrengthSubstanceKey = response;
              });
            }
            this.ingredient.basisOfStrengthSubstanceKeyType = this.substanceKeyTypeConfig;
          }
          // ******** SUBSTANCE KEY RESOLVER END *************

          /*
          if (!this.substanceKeyTypeConfig) {
            alert('There is no Substance configuration found in config file: substance.linking.keyType.default. Unable to add Basis of Strength');
            this.basisOfStrengthMessage = 'Add Substance Key Type in Config';
          } else {
            this.getSubstanceCode(relatedSubstance.refuuid, 'basisofstrength');

            this.basisOfStrengthSubstanceUuid = relatedSubstance.refuuid;
            this.basisOfStrengthIngredientName = relatedSubstance.name;

            // Clear the Validation Message
            this.basisOfStrengthMessage = '';
            this.ingredient.$$basisOfStrengthValidation = '';

            // Get Active Moiety
            this.getActiveMoiety(this.basisOfStrengthSubstanceUuid, 'basisofstrength');
          }
        } // If relatedSubstance.refuuid != null
        */


        } // if relatedSubstance.refuuid is not null
      } // if relatedSubstance is not null
      // else substance is null
    } else {
      this.ingredient.basisOfStrengthSubstanceKey = "";
      this.ingredient.basisOfStrengthSubstanceKeyType = "";
      this.basisOfStrengthSubstanceUuid = "";
    }
  }

  getSubstanceBySubstanceKey() {
    if (this.ingredient != null) {
      // Get Substance Details by any Ids (uuid, approval_id, bdnum, substance name)
      if (this.ingredient.substanceKey) {
        const subSubscription = this.generalService.getSubstanceByAnyId(this.ingredient.substanceKey).subscribe(response => {
          if (response) {
            if (response.uuid) {
              this.ingredientNameSubstanceUuid = response.uuid;
              this.ingredientName = response._name;

              // Get Active Moiety
              //this.getActiveMoiety(this.ingredientNameSubstanceUuid, 'ingredientname');
            }
          }
        });
        this.subscriptions.push(subSubscription);
      }

      // Get Basis of Strength
      if (this.ingredient.basisOfStrengthSubstanceKey) {
        // Get Substance Details by any Ids (uuid, approval_id, bdnum, substance name)
        this.generalService.getSubstanceByAnyId(this.ingredient.basisOfStrengthSubstanceKey).subscribe(response => {
          if (response) {
            if (response.uuid) {
              this.basisOfStrengthSubstanceUuid = response.uuid;
              this.basisOfStrengthIngredientName = response._name;

              // Get Active Moiety
              this.getActiveMoiety(this.basisOfStrengthSubstanceUuid, 'basisofstrength');
            }
          }
        });
      }
    }
  }

  getSubstanceCode(substanceUuid: string, type: string) {
    const subCodeSubscription = this.generalService.getSubstanceCodesBySubstanceUuid(substanceUuid).subscribe(response => {
      if (response) {
        const substanceCodes = response;
        for (let index = 0; index < substanceCodes.length; index++) {
          if (substanceCodes[index].codeSystem) {
            if ((substanceCodes[index].codeSystem === this.substanceKeyTypeConfig) &&
              (substanceCodes[index].type === 'PRIMARY')) {

              if (type) {
                if (type === 'ingredientname') {
                  this.ingredient.substanceKey = substanceCodes[index].code;
                  this.ingredient.substanceKeyType = this.substanceKeyTypeConfig;

                  if (!this.ingredient.basisOfStrengthSubstanceKey) {
                    this.ingredient.basisOfStrengthSubstanceKey = substanceCodes[index].code;
                    this.ingredient.basisOfStrengthSubstanceKeyType = this.substanceKeyTypeConfig;
                  }
                }

                if (type === 'basisofstrength') {
                  this.ingredient.basisOfStrengthSubstanceKey = substanceCodes[index].code;
                  this.ingredient.basisOfStrengthSubstanceKeyType = this.substanceKeyTypeConfig;
                }
              }
              break;
            }
          }
        }
      }
    });
    this.subscriptions.push(subCodeSubscription);
  }

  getActiveMoiety(substanceUuid: string, type: string) {
    if (substanceUuid != null) {
      // Get Active Moiety - Relationship
      this.generalService.getSubstanceRelationships(substanceUuid).subscribe(responseRel => {
        if (responseRel) {
          if (responseRel && responseRel.length > 0) {
            for (let i = 0; i < responseRel.length; i++) {
              const relType = responseRel[i].type;
              // if type is ACTIVE MOIETY, get Relationship Name
              if (relType && relType === 'ACTIVE MOIETY') {
                if (responseRel[i].relatedSubstance.name) {
                  if ((type != null) && (type === 'ingredientname')) {
                    this.ingredientNameActiveMoiety.push(responseRel[i].relatedSubstance.name);
                  } else {
                    this.basisOfStrengthActiveMoiety.push(responseRel[i].relatedSubstance.name);
                  }
                }
                break;
              }
            }
          }
        }
      });
    }
  }

  confirmReviewIngredient() {
    if (this.ingredient.reviewDate) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: { message: 'Are you sure you want to overwrite Reviewed By and Review Date?' }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result === true) {
          this.reviewIngredient();
        }
      });
    } else {
      this.reviewIngredient();
    }
  }

  reviewIngredient() {
    const currentDate = this.generalService.getCurrentDate();
    this.ingredient.reviewDate = currentDate;
    this.ingredient.reviewedBy = this.username;
  }

  showMessageIngredientName(message: string): void {
    this.ingredientNameMessage = message;
    // Send this to Application form for Validation
    // This message is displayed when 'No Substance Found' is passed from Substance Search Selector
    this.ingredient.$$ingredientNameValidation = 'Ingredient Name: ' + this.ingredientNameMessage;
  }

  showMessageBasisOfStrength(message: string): void {
    this.basisOfStrengthMessage = message;
    // Send this to Application form for Validation
    // This message is displayed when 'No Substance Found' is passed from Substance Search Selector
    this.ingredient.$$basisOfStrengthValidation = 'Basis of Strength: ' + this.basisOfStrengthMessage;
  }

  searchValueOutChange(searchValue: string) {
    this.searchValue = searchValue;
    // SearchValue is empty, clear the message
    if (!this.searchValue) {
      this.ingredientNameMessage = '';
      this.ingredient.$$ingredientNameValidation = '';
    }
    // if searchValue is not empty and there is no Ingredient Name selected, display error message
    if ((this.searchValue) && (this.ingredientNameSubstanceUuid === null || this.ingredientNameSubstanceUuid === undefined)) {
      this.ingredient.$$ingredientNameValidation = 'Ingredient Name: No substances found for ' + this.searchValue;
    }
  }

  searchValueBasisOutChange(searchValue: string) {
    this.searchValue = searchValue;
    if (!this.searchValue) {
      this.basisOfStrengthMessage = '';
      this.ingredient.$$basisOfStrengthValidation = '';
    }
    if ((this.searchValue) && (this.basisOfStrengthSubstanceUuid === null || this.basisOfStrengthSubstanceUuid === undefined)) {
      this.ingredient.$$basisOfStrengthValidation = 'Basis of Strength: No substances found for ' + this.searchValue;
    }
  }
}
