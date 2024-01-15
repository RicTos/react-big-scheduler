import React, { Component, createRef } from 'react'
import Scheduler, { SchedulerData, ViewType, DATE_FORMAT, DemoData } from '../src/index'
import ViewSrcCode from './ViewSrcCode'
import withDragDropContext from './withDnDContext'
import * as dayjsLocale from "dayjs/locale/it";
import * as antdLocale from "antd/locale/pt_BR";

class Basic extends Component {
    constructor(props) {
        super(props);

        //let schedulerData = new SchedulerData(new moment("2017-12-18").format(DATE_FORMAT), ViewTypes.Week);
        let schedulerData = new SchedulerData('2017-12-02', ViewType.Month, false, false,
            { // for tests
                dayMaxEvents: 99,
                weekMaxEvents: 9669,
                monthMaxEvents: 9669,
                quarterMaxEvents: 6599,
                yearMaxEvents: 9956,
                customMaxEvents: 9965,
                eventItemPopoverTrigger: 'click',
                schedulerContentHeight: '350px',
                responsiveByParent: true,
                // dayStartFrom: 2,
                // dayStopTo: 10,
                minuteStep: 60,
                //  dayResourceTableWidth:10,
                dayCellWidth: 60,
                nonAgendaDayCellHeaderFormat: "HH:mm",
            });
        schedulerData.setSchedulerLocale(dayjsLocale);
        schedulerData.setCalendarPopoverLocale(antdLocale);
        schedulerData.setResources(DemoData.resources);
        schedulerData.setEvents(DemoData.events);
        this.state = {
            viewModel: schedulerData,
            mounted: false,
        }

        this.divRef = createRef();
    }

    componentDidMount() {
        this.setState((prevState) => ({ ...prevState, mounted: true }));
    }

    render() {
        const { viewModel } = this.state;

        return (
            <div>
                <div>
                    <h3 style={{ textAlign: 'center' }}>Basic example<ViewSrcCode srcCodeUrl="https://github.com/StephenChou1017/react-big-scheduler/blob/master/example/Basic.js" /></h3>
                          <div ref={this.divRef} style={{width:"100%", height: 1000 }}>
                                {this.state.mounted && (
                                    <Scheduler 
                                        schedulerData={viewModel}
                                        parentRef={this.divRef}
                                        prevClick={this.prevClick}
                                        nextClick={this.nextClick}
                                        onSelectDate={this.onSelectDate}
                                        onViewChange={this.onViewChange}
                                        // eventItemClick={this.eventClicked}
                                        viewEventClick={this.ops1}
                                        viewEventText="Ops 1"
                                        viewEvent2Text="Ops 2"
                                        viewEvent2Click={this.ops2}
                                        updateEventStart={this.updateEventStart}
                                        updateEventEnd={this.updateEventEnd}
                                        moveEvent={this.moveEvent}
                                        newEvent={this.newEvent}
                                        onScrollLeft={this.onScrollLeft}
                                        onScrollRight={this.onScrollRight}
                                        onScrollTop={this.onScrollTop}
                                        onScrollBottom={this.onScrollBottom}
                                        toggleExpandFunc={this.toggleExpandFunc}
                                    />
                            )}
                    </div>    
                </div>
            </div>
        )
    }

    prevClick = (schedulerData) => {
        schedulerData.prev();
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    nextClick = (schedulerData) => {
        schedulerData.next();
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    onViewChange = (schedulerData, view) => {
        const start = new Date();
        schedulerData.setViewType(view.viewType, view.showAgenda, view.isEventPerspective);
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
        function secondsBetween(date1, date2) {
            var diff = Math.abs(date1.getTime() - date2.getTime());
            return diff / 1000;
        }

        console.log("Elapsed seconds: " + secondsBetween(start, new Date()))
    }

    onSelectDate = (schedulerData, date) => {
        schedulerData.setDate(date);
        schedulerData.setEvents(DemoData.events);
        this.setState({
            viewModel: schedulerData
        })
    }

    eventClicked = (schedulerData, event) => {
        alert(`You just clicked an event: {id: ${event.id}, title: ${event.title}}`);
    };

    ops1 = (schedulerData, event) => {
        alert(`You just executed ops1 to event: {id: ${event.id}, title: ${event.title}}`);
    };

    ops2 = (schedulerData, event) => {
        alert(`You just executed ops2 to event: {id: ${event.id}, title: ${event.title}}`);
    };

    newEvent = (schedulerData, slotId, slotName, start, end, type, item) => {
        if (confirm(`Do you want to create a new event? {slotId: ${slotId}, slotName: ${slotName}, start: ${start}, end: ${end}, type: ${type}, item: ${item}}`)) {

            let newFreshId = 0;
            schedulerData.events.forEach((item) => {
                if (item.id >= newFreshId)
                    newFreshId = item.id + 1;
            });

            let newEvent = {
                id: newFreshId,
                title: 'New event you just created',
                start: start,
                end: end,
                resourceId: slotId,
                bgColor: 'purple'
            }
            schedulerData.addEvent(newEvent);
            this.setState({
                viewModel: schedulerData
            })
        }
    }

    updateEventStart = (schedulerData, event, newStart) => {
        if (confirm(`Do you want to adjust the start of the event? {eventId: ${event.id}, eventTitle: ${event.title}, newStart: ${newStart}}`)) {
            schedulerData.updateEventStart(event, newStart);
        }
        this.setState({
            viewModel: schedulerData
        })
    }

    updateEventEnd = (schedulerData, event, newEnd) => {
        if (confirm(`Do you want to adjust the end of the event? {eventId: ${event.id}, eventTitle: ${event.title}, newEnd: ${newEnd}}`)) {
            schedulerData.updateEventEnd(event, newEnd);
        }
        this.setState({
            viewModel: schedulerData
        })
    }

    moveEvent = (schedulerData, event, slotId, slotName, start, end) => {
        if (confirm(`Do you want to move the event? {eventId: ${event.id}, eventTitle: ${event.title}, newSlotId: ${slotId}, newSlotName: ${slotName}, newStart: ${start}, newEnd: ${end}`)) {
            schedulerData.moveEvent(event, slotId, slotName, start, end);
            this.setState({
                viewModel: schedulerData
            })
        }
    }

    onScrollRight = (schedulerData, schedulerContent, maxScrollLeft) => {
        if (schedulerData.ViewTypes === ViewType.Day) {
            schedulerData.next();
            schedulerData.setEvents(DemoData.events);
            this.setState({
                viewModel: schedulerData
            });

            schedulerContent.scrollLeft = maxScrollLeft - 10;
        }
    }

    onScrollLeft = (schedulerData, schedulerContent, maxScrollLeft) => {
        if (schedulerData.ViewTypes === ViewType.Day) {
            schedulerData.prev();
            schedulerData.setEvents(DemoData.events);
            this.setState({
                viewModel: schedulerData
            });

            schedulerContent.scrollLeft = 10;
        }
    }

    onScrollTop = (schedulerData, schedulerContent, maxScrollTop) => {
        console.log('onScrollTop');
    }

    onScrollBottom = (schedulerData, schedulerContent, maxScrollTop) => {
        console.log('onScrollBottom');
    }

    toggleExpandFunc = (schedulerData, slotId) => {
        schedulerData.toggleExpandStatus(slotId);
        this.setState({
            viewModel: schedulerData
        });
    }
}

export default withDragDropContext(Basic)
