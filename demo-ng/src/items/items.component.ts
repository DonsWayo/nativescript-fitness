import { Component, NgZone } from "@angular/core";
import { alert } from "tns-core-modules/ui/dialogs";
import { AggregateBy, Fitness, FitnessType } from "nativescript-fitness";

@Component({
  selector: "ItemsComponent",
  moduleId: module.id,
  templateUrl: "./items.component.html"
})

export class ItemsComponent {
  private static TYPES: Array<FitnessType> = [
    {name: "height", accessType: "read"},
    {name: "weight", accessType: "readAndWrite"}, // just for show
    {name: "steps", accessType: "read"},
    {name: "distance", accessType: "read"},
    {name: "heartRate", accessType: "read"},
    {name: "fatPercentage", accessType: "read"},
    {name: "fatPercentage", accessType: "read"},
    {name: "cardio", accessType: "read"}
  ];

  private fitness: Fitness;
  resultToShow = "";

  constructor(private zone: NgZone) {
    this.fitness = new Fitness();
  }

  isAvailable(): void {
    this.fitness.isAvailable(true)
        .then(available => this.resultToShow = available ? "Health Data available" : "Health Data not available :(");
  }

  isAuthorized(): void {
    this.fitness.isAuthorized([<FitnessType>{name: "weight", accessType: "read"}])
        .then(authorized => setTimeout(() => alert({
          title: "Authentication result",
          message: (authorized ? "" : "Not ") + "authorized for " + JSON.stringify(ItemsComponent.TYPES),
          okButtonText: "Ok!"
        }), 300));
  }

  requestAuthForVariousTypes(): void {
    this.fitness.requestAuthorization(ItemsComponent.TYPES)
        .then(authorized => setTimeout(() => alert({
          title: "Authentication result",
          message: (authorized ? "" : "Not ") + "authorized for " + JSON.stringify(ItemsComponent.TYPES),
          okButtonText: "Ok!"
        }), 300))
        .catch(error => console.log("Request auth error: ", error));
  }

  getData(dataType: string, unit?: string, aggregateBy?: AggregateBy): Promise<void> {
    return this.fitness.query(
        {
          startDate: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day ago
          endDate: new Date(), // now
          dataType,
          unit,
          aggregateBy,
          sortOrder: "desc"
        })
        .then(result => {
          this.zone.run(() => {
            console.log(JSON.stringify(result));
            this.resultToShow = JSON.stringify(result);
          });
        })
        .catch(error => this.resultToShow = error);
  }

  startMonitoringData(dataType: string, unit: string): void {
    this.fitness.startMonitoring(
        {
          dataType: dataType,
          enableBackgroundUpdates: true,
          backgroundUpdateFrequency: "immediate",
          onUpdate: (completionHandler: () => void) => {
            console.log("Our app was notified that health data changed, so querying...");
            this.getData(dataType, unit).then(() => completionHandler());
          }
        })
        .then(() => this.resultToShow = `Started monitoring ${dataType}`)
        .catch(error => this.resultToShow = error);
  }

  stopMonitoringData(dataType: string): void {
    this.fitness.stopMonitoring(
        {
          dataType: dataType,
        })
        .then(() => this.resultToShow = `Stopped monitoring ${dataType}`)
        .catch(error => this.resultToShow = error);
  }
}
