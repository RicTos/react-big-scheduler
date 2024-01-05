import { ViewType, CellUnit, DATE_FORMAT } from './index'

//getSummary func example
export const getSummary = (schedulerData, headerEvents, slotId, slotName, headerStart, headerEnd) => {
    return { text: 'Summary', color: 'red', fontSize: '1.2rem' };
}

//getCustomDate example
export const getCustomDate = (schedulerData, num, date = undefined) => {
    const { viewType } = schedulerData;
    let selectDate = schedulerData.startDate;
    if (date != undefined)
        selectDate = date;

    let startDate = num === 0 ? selectDate :
        schedulerData.localeDayjs(new Date(selectDate)).add(2 * num, 'days'),
        endDate = schedulerData.localeDayjs(new Date(startDate)).add(1, 'days'),
        cellUnit = CellUnit.Hour;
    if (viewType === ViewType.Custom1) {
        let monday = schedulerData.localeDayjs(new Date(selectDate)).startOf('week');
        startDate = num === 0 ? monday : schedulerData.localeDayjs(new Date(monday)).add(2 * num, 'weeks');
        endDate = schedulerData.localeDayjs(new Date(startDate)).add(1, 'weeks').endOf('week');
        cellUnit = CellUnit.Day;
    } else if (viewType === ViewType.Custom2) {
        let firstDayOfMonth = schedulerData.localeDayjs(new Date(selectDate)).startOf('month');
        startDate = num === 0 ? firstDayOfMonth : schedulerData.localeDayjs(new Date(firstDayOfMonth)).add(2 * num, 'months');
        endDate = schedulerData.localeDayjs(new Date(startDate)).add(1, 'months').endOf('month');
        cellUnit = CellUnit.Day;
    }

    return {
        startDate,
        endDate,
        cellUnit
    };
}

//getNonAgendaViewBodyCellBgColor example
export const getNonAgendaViewBodyCellBgColor = (schedulerData, slotId, header) => {
    if (!header.nonWorkingTime) {
        return '#87e8de';
    }

    return undefined;
}

//getDateLabel func example
export const getDateLabel = (schedulerData, viewType, startDate, endDate) => {
    let start = schedulerData.localeDayjs(new Date(startDate));
    let end = schedulerData.localeDayjs(endDate);
    let dateLabel = start.format('MMM D, YYYY');

    if (viewType === ViewType.Week || (start != end && (
        viewType === ViewType.Custom || viewType === ViewType.Custom1 || viewType === ViewType.Custom2
    ))) {
        dateLabel = `${start.format('MMM D')}-${end.format('D, YYYY')}`;
        if (start.month() !== end.month())
            dateLabel = `${start.format('MMM D')}-${end.format('MMM D, YYYY')}`;
        if (start.year() !== end.year())
            dateLabel = `${start.format('MMM D, YYYY')}-${end.format('MMM D, YYYY')}`;
    }
    else if (viewType === ViewType.Month) {
        dateLabel = start.format('MMMM YYYY');
    }
    else if (viewType === ViewType.Quarter) {
        dateLabel = `${start.format('MMM D')}-${end.format('MMM D, YYYY')}`;
    }
    else if (viewType === ViewType.Year) {
        dateLabel = start.format('YYYY');
    }

    return dateLabel;
}

export const getEventText = (schedulerData, event) => {
    if (!schedulerData.isEventPerspective) return event.title;

    let eventText = event.title;
    schedulerData.resources.forEach((item) => {
        if (item.id === event.resourceId) {
            eventText = item.name;
        }
    })

    return eventText;
}

export const getScrollSpecialDayjs = (schedulerData, startDayjs, endDayjs) => {
    // return endDayjs;
    const { localeDayjs } = schedulerData;
    return localeDayjs(new Date());
}

export const isNonWorkingTime = (schedulerData, time) => {
    const { localeDayjs } = schedulerData;
    if (schedulerData.cellUnit === CellUnit.Hour) {
        let hour = localeDayjs(new Date(time)).hour();
        if (hour < 9 || hour > 18)
            return true;
    }
    else {
        let dayOfWeek = localeDayjs(new Date(time)).isoWeekday();
        if (dayOfWeek === 6 || dayOfWeek === 7)
            return true;
    }

    return false;
}

export default {
    //getSummaryFunc: getSummary,
    getSummaryFunc: undefined,
    //getCustomDateFunc: getCustomDate,
    getCustomDateFunc: undefined,
    // getNonAgendaViewBodyCellBgColorFunc: getNonAgendaViewBodyCellBgColor,
    getNonAgendaViewBodyCellBgColorFunc: undefined,
    getScrollSpecialDayjsFunc: getScrollSpecialDayjs,
    getDateLabelFunc: getDateLabel,
    getEventTextFunc: getEventText,
    isNonWorkingTimeFunc: isNonWorkingTime,
}
