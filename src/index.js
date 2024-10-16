import React, { Component } from 'react'
import { PropTypes } from 'prop-types'

// Col, Row and Icon do not have their own less files for styling. They use 
// rules declared in antd's global css. If these styles are imported directly
// from within antd, they'll include, for instance, reset rules. These will
// affect everything on the page and in essence would leak antd's global styles
// into all projects using this library. Instead of doing that, we are using
// a hack which allows us to wrap all antd styles to target specific root. In
// this case the root id will be "RBS-Scheduler-root". This way the reset styles
// won't be applied to elements declared outside of <Scheduler /> component.
//
// You can get more context for the issue by reading:
// https://github.com/ant-design/ant-design/issues/4331
// The solution is based on:
// https://github.com/ant-design/ant-design/issues/4331#issuecomment-391066131
// 
// For development
// This fix is implemented with webpack's NormalModuleReplacementPlugin in
// webpack/webpack-dev.config.js.
//
// For library builds
// This fix is implemented by the build script in scripts/build.js
//
// The next components have their own specific stylesheets which we import
// separately here to avoid importing from files which have required the global
// antd styles.

import EventItem from './EventItem'
import DnDSource from './DnDSource'
import DnDContext from './DnDContext'
import ResourceView from './ResourceView'
import HeaderView from './HeaderView'
import BodyView from './BodyView'
import ResourceEvents from './ResourceEvents'
import AgendaView from './AgendaView'
import AddMorePopover from './AddMorePopover'
import ViewType from './ViewType'
import CellUnit from './CellUnit'
import SummaryPos from './SummaryPos'
import SchedulerData from './SchedulerData'
import DemoData from './DemoData'
import SchedulerHeader from './SchedulerHeader'

const debounce = (func, delay, { leading } = {}) => {
    let timerId
  
    return (...args) => {
      if (!timerId && leading) {
        func(...args)
      }
      clearTimeout(timerId)
  
      timerId = setTimeout(() => func(...args), delay)
    }
  }
  
  (...args) => debounce(...args)

class Scheduler extends Component {

    constructor(props) {
        super(props);

        const { schedulerData, dndSources, parentRef } = props;
        let sources = [];
        sources.push(new DnDSource((props) => {
            return props.eventItem;
        }, EventItem, schedulerData.config.dragAndDropEnabled));
        if (dndSources != undefined && dndSources.length > 0) {
            sources = [...sources, ...dndSources];
        }
        let dndContext = new DnDContext(sources, ResourceEvents);

        this.currentArea = -1;
        this.state = {
            dndContext: dndContext,
            contentScrollbarHeight: 17,
            contentScrollbarWidth: 17,
            resourceScrollbarHeight: 17,
            resourceScrollbarWidth: 17,
            documentWidth: 0,
            documentHeight: 0,
        };
        this.scrollLeft = 0;
        this.scrollTop = 0;

        if ((schedulerData.isSchedulerResponsive() && !schedulerData.config.responsiveByParent) || parentRef === undefined) {
            schedulerData._setDocumentWidth(document.documentElement.clientWidth);
            window.onresize = debounce(this.onWindowResize, schedulerData.config.resizeDelay);
        }
    }

    onWindowResize = (e) => {
        const { schedulerData } = this.props;
        schedulerData._setDocumentWidth(document.documentElement.clientWidth);
        this.setState({
            documentWidth: document.documentElement.clientWidth,
            documentHeight: document.documentElement.clientHeight,
        });
    }

    static propTypes = {
        parentRef: PropTypes.object,
        schedulerData: PropTypes.object.isRequired,
        prevClick: PropTypes.func.isRequired,
        nextClick: PropTypes.func.isRequired,
        onViewChange: PropTypes.func.isRequired,
        onSelectDate: PropTypes.func.isRequired,
        onSetAddMoreState: PropTypes.func,
        updateEventStart: PropTypes.func,
        updateEventEnd: PropTypes.func,
        moveEvent: PropTypes.func,
        movingEvent: PropTypes.func,
        leftCustomHeader: PropTypes.object,
        rightCustomHeader: PropTypes.object,
        newEvent: PropTypes.func,
        subtitleGetter: PropTypes.func,
        eventItemClick: PropTypes.func,
        viewEventClick: PropTypes.func,
        viewEventText: PropTypes.string,
        viewEvent2Click: PropTypes.func,
        viewEvent2Text: PropTypes.string,
        conflictOccurred: PropTypes.func,
        eventItemTemplateResolver: PropTypes.func,
        dndSources: PropTypes.array,
        slotClickedFunc: PropTypes.func,
        toggleExpandFunc: PropTypes.func,
        slotItemTemplateResolver: PropTypes.func,
        nonAgendaCellHeaderTemplateResolver: PropTypes.func,
        onScrollLeft: PropTypes.func,
        onScrollRight: PropTypes.func,
        onScrollTop: PropTypes.func,
        onScrollBottom: PropTypes.func,
    }

    componentDidMount(props, state) {
        const { schedulerData, parentRef } = this.props;

        this.resolveScrollbarSize();

        if (parentRef !== undefined) {
            if (schedulerData.config.responsiveByParent && !!parentRef.current) {
                schedulerData._setDocumentWidth(parentRef.current.offsetWidth);
                this.ulObserver = new ResizeObserver((entries, observer) => {
                    if (!!parentRef.current) {
                        const width = parentRef.current.offsetWidth;
                        const height = parentRef.current.offsetHeight;
                        schedulerData._setDocumentWidth(width);
                        this.setState({
                            documentWidth: width,
                            documentHeight: height,
                        });
                    }
                });

                debounce(this.ulObserver.observe(parentRef.current), schedulerData.config.resizeDelay);
            }
        }
    }

    componentDidUpdate(props, state) {
        this.resolveScrollbarSize();

        const { schedulerData } = this.props;
        const { localeDayjs, behaviors } = schedulerData;
        if (schedulerData.getScrollToSpecialDayjs() && !!behaviors.getScrollSpecialDayjsFunc) {
            if (!!this.schedulerContent && this.schedulerContent.scrollWidth > this.schedulerContent.clientWidth) {
                let start = localeDayjs(new Date(schedulerData.startDate)).startOf('day'),
                    end = localeDayjs(new Date(schedulerData.endDate)).endOf('day'),
                    specialDayjs = behaviors.getScrollSpecialDayjsFunc(schedulerData, start, end);
                if (specialDayjs >= start && specialDayjs <= end) {
                    let index = 0;
                    schedulerData.headers.forEach((item) => {
                        let header = localeDayjs(new Date(item.time));
                        if (specialDayjs >= header)
                            index++;
                    })
                    this.schedulerContent.scrollLeft = (index - 1) * schedulerData.getContentCellWidth();

                    schedulerData.setScrollToSpecialDayjs(false);
                }
            }
        }
    }

    render() {
        const { schedulerData, leftCustomHeader, rightCustomHeader, customerResourceHeader } = this.props;
        const { viewType, renderData, showAgenda, config } = schedulerData;
        const width = schedulerData.getSchedulerWidth();

        let tbodyContent = <tr />;
        if (showAgenda) {
            tbodyContent = <AgendaView
                {...this.props}
            />
        }
        else {
            let resourceTableWidth = schedulerData.getResourceTableWidth();
            let contentScrollbarWidth = this.state.contentScrollbarWidth
            let schedulerContainerWidth = width - (config.resourceViewEnabled ? resourceTableWidth : 0) - contentScrollbarWidth
            let schedulerWidth = schedulerData.getContentTableWidth() - 1;
            let DndResourceEvents = this.state.dndContext.getDropTarget(config.dragAndDropEnabled);
            let eventDndSource = this.state.dndContext.getDndSource();
            
            let displayRenderData = renderData.filter(o => o.render);
            let resourceEventsList = displayRenderData.map((item) => {
                return <DndResourceEvents
                {...this.props}
                key={item.slotId}
                resourceEvents={item}
                dndSource={eventDndSource}
                />
            });
            
            let contentScrollbarHeight = this.state.contentScrollbarHeight,
            resourceScrollbarHeight = this.state.resourceScrollbarHeight,
            resourceScrollbarWidth = this.state.resourceScrollbarWidth,
            contentHeight = typeof config.schedulerContentHeight === "number" ? config.schedulerContentHeight : this.state.documentHeight - config.tableHeaderHeight;
            let resourcePaddingBottom = resourceScrollbarHeight === 0 ? contentScrollbarHeight : 0;
            let contentPaddingBottom = contentScrollbarHeight === 0 ? resourceScrollbarHeight : 0;
            let schedulerContentStyle = {
                overflowX: viewType === ViewType.Week  ? 'hidden' : 'auto',
                overflowY: 'auto',
                margin: "0px",
                position: "relative",
                height: contentHeight,
                paddingBottom: contentPaddingBottom,
                margin: `0px -${contentScrollbarWidth}px 0px 0px`
             };
            let resourceContentStyle = {
                height: contentHeight,
                overflowX: "hidden",
                overflowY: "hidden",
                width: resourceTableWidth + resourceScrollbarWidth - 2,
            };
            if (config.schedulerMaxHeight > 0) {
                schedulerContentStyle = {
                    ...schedulerContentStyle,
                    maxHeight: config.schedulerMaxHeight - config.tableHeaderHeight
                };
                resourceContentStyle = {
                    ...resourceContentStyle,
                    maxHeight: config.schedulerMaxHeight - config.tableHeaderHeight,
                };
            }
            
            let resourceName = schedulerData.isEventPerspective ? config.taskName : config.resourceName;
            tbodyContent = (
                <tr>
                    <td style={{ display: config.resourceViewEnabled ? undefined : 'none', width: resourceTableWidth, verticalAlign: 'top' }}>
                        <div className="resource-view">
                            <div className="resource-view-header" style={{ overflow: "hidden", height: config.tableHeaderHeight }}>
                                <div style={{ overflowX: "scroll", overflowY: "hidden", margin: `0px 0px -${contentScrollbarHeight}px` }}>
                                    <table className="resource-table">
                                        <thead>
                                            <tr style={{ height: config.tableHeaderHeight }}>
                                                <th className="header3-text">
                                                    {customerResourceHeader ? customerResourceHeader(resourceName) : resourceName}
                                                </th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>
                            </div>
                            <div style={resourceContentStyle}
                                ref={this.schedulerResourceRef}
                                onMouseOver={this.onSchedulerResourceMouseOver}
                                onMouseOut={this.onSchedulerResourceMouseOut}
                                onScroll={this.onSchedulerResourceScroll}>
                                <ResourceView
                                    {...this.props}
                                    width={resourceContentStyle.width}
                                    contentScrollbarHeight={resourcePaddingBottom}
                                />
                            </div>
                        </div>
                    </td>
                    <td>
                        <div className="scheduler-view" style={{  width: schedulerContainerWidth, verticalAlign: 'top' }}>
                            <div className="scheduler-view-header" style={{ overflow: "hidden", height: config.tableHeaderHeight }}>
                                <div style={{  overflowX: "scroll", overflowY: "hidden", margin: '0px 0px -' + contentScrollbarHeight + 'px' }}
                                    ref={this.schedulerHeadRef}
                                    onMouseOver={this.onSchedulerHeadMouseOver}
                                    onMouseOut={this.onSchedulerHeadMouseOut}
                                    onScroll={this.onSchedulerHeadScroll}>
                                    <div style={{ paddingRight: contentScrollbarWidth + 'px', width: schedulerWidth + contentScrollbarWidth }}>
                                        <table className="scheduler-bg-table">
                                            <HeaderView {...this.props} />
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div style={schedulerContentStyle}
                                ref={this.schedulerContentRef}
                                onMouseOver={this.onSchedulerContentMouseOver}
                                onMouseOut={this.onSchedulerContentMouseOut}
                                onScroll={this.onSchedulerContentScroll} >
                                <div style={{ width: schedulerWidth }}>
                                    <div className="scheduler-content">
                                        <table className="scheduler-content-table" >
                                            <tbody>
                                                {resourceEventsList}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="scheduler-bg">
                                        <table className="scheduler-bg-table"
                                            style={{ width: schedulerWidth }}
                                            ref={this.schedulerContentBgTableRef} >
                                            <BodyView {...this.props} />
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            );
        };

        let schedulerHeader = <div />;
        if (config.headerEnabled) {
            schedulerHeader = (
                <SchedulerHeader
                    onViewChange={this.onViewChange}
                    schedulerData={schedulerData}
                    onSelectDate={this.onSelect}
                    goNext={this.goNext}
                    goBack={this.goBack}
                    rightCustomHeader={rightCustomHeader}
                    leftCustomHeader={leftCustomHeader}
                />
            );
        }

        return (
            <table id="RBS-Scheduler-root" className="scheduler" style={{ width: `1px` }}>
                <thead>
                    <tr>
                        <td colSpan="2">
                            {schedulerHeader}
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {tbodyContent}
                </tbody>
            </table>
        )
    }

    resolveScrollbarSize = () => {
        let contentScrollbarHeight = 17,
            contentScrollbarWidth = 17,
            resourceScrollbarHeight = 17,
            resourceScrollbarWidth = 17;
        if (!!this.schedulerContent) {
            contentScrollbarHeight = this.schedulerContent.offsetHeight - this.schedulerContent.clientHeight;
            contentScrollbarWidth = this.schedulerContent.offsetWidth - this.schedulerContent.clientWidth;
        }
        if (!!this.schedulerResource) {
            resourceScrollbarHeight = this.schedulerResource.offsetHeight - this.schedulerResource.clientHeight;
            resourceScrollbarWidth = this.schedulerResource.offsetWidth - this.schedulerResource.clientWidth;
        }

        let tmpState = {};
        let needSet = false;
        if (contentScrollbarHeight != this.state.contentScrollbarHeight) {
            tmpState = { ...tmpState, contentScrollbarHeight: contentScrollbarHeight };
            needSet = true;
        }
        if (contentScrollbarWidth != this.state.contentScrollbarWidth) {
            tmpState = { ...tmpState, contentScrollbarWidth: contentScrollbarWidth };
            needSet = true;
        }
        if (resourceScrollbarHeight != this.state.resourceScrollbarHeight) {
            tmpState = { ...tmpState, resourceScrollbarHeight: resourceScrollbarHeight };
            needSet = true;
        }
        if (resourceScrollbarWidth != this.state.resourceScrollbarWidth) {
            tmpState = { ...tmpState, resourceScrollbarWidth: resourceScrollbarWidth };
            needSet = true;
        }
        if (needSet) 
            this.setState(tmpState);
    }

    schedulerHeadRef = (element) => {
        this.schedulerHead = element;
    }

    onSchedulerHeadMouseOver = () => {
        this.currentArea = 2;
    }

    onSchedulerHeadMouseOut = () => {
        this.currentArea = -1;
    }

    onSchedulerHeadScroll = (proxy, event) => {
        if ((this.currentArea === 2 || this.currentArea === -1) && this.schedulerContent.scrollLeft != this.schedulerHead.scrollLeft)
            this.schedulerContent.scrollLeft = this.schedulerHead.scrollLeft;
    }

    schedulerResourceRef = (element) => {
        this.schedulerResource = element;
    }

    onSchedulerResourceMouseOver = () => {
        this.currentArea = 1;
    }

    onSchedulerResourceMouseOut = () => {
        this.currentArea = -1;
    }

    onSchedulerResourceScroll = (proxy, event) => {
        if (!!this.schedulerResource) {
            if ((this.currentArea === 1 || this.currentArea === -1) && this.schedulerContent.scrollTop != this.schedulerResource.scrollTop)
                this.schedulerContent.scrollTop = this.schedulerResource.scrollTop;
        }
    }

    schedulerContentRef = (element) => {
        this.schedulerContent = element;
    }

    schedulerContentBgTableRef = (element) => {
        this.schedulerContentBgTable = element;
    }

    onSchedulerContentMouseOver = () => {
        this.currentArea = 0;
    }

    onSchedulerContentMouseOut = () => {
        this.currentArea = -1;
    }

    onSchedulerContentScroll = (proxy, event) => {
        if (!!this.schedulerResource) {
            if (this.currentArea === 0 || this.currentArea === -1) {
                if (this.schedulerHead.scrollLeft != this.schedulerContent.scrollLeft)
                    this.schedulerHead.scrollLeft = this.schedulerContent.scrollLeft;
                if (this.schedulerResource.scrollTop != this.schedulerContent.scrollTop)
                    this.schedulerResource.scrollTop = this.schedulerContent.scrollTop;
            }
        }

        const { schedulerData, onScrollLeft, onScrollRight, onScrollTop, onScrollBottom } = this.props;
        if (this.schedulerContent.scrollLeft !== this.scrollLeft) {
            if (this.schedulerContent.scrollLeft === 0 && onScrollLeft != undefined) {
                onScrollLeft(schedulerData, this.schedulerContent, this.schedulerContent.scrollWidth - this.schedulerContent.clientWidth);
            }
            if (Math.round(this.schedulerContent.scrollLeft) === this.schedulerContent.scrollWidth - this.schedulerContent.clientWidth && onScrollRight != undefined) {
                onScrollRight(schedulerData, this.schedulerContent, this.schedulerContent.scrollWidth - this.schedulerContent.clientWidth);
            }
        } else if (this.schedulerContent.scrollTop !== this.scrollTop) {
            if (this.schedulerContent.scrollTop === 0 && onScrollTop != undefined) {
                onScrollTop(schedulerData, this.schedulerContent, this.schedulerContent.scrollHeight - this.schedulerContent.clientHeight);
            }
            if (Math.round(this.schedulerContent.scrollTop) === this.schedulerContent.scrollHeight - this.schedulerContent.clientHeight && onScrollBottom != undefined) {
                onScrollBottom(schedulerData, this.schedulerContent, this.schedulerContent.scrollHeight - this.schedulerContent.clientHeight);
            }
        }
        this.scrollLeft = this.schedulerContent.scrollLeft;
        this.scrollTop = this.schedulerContent.scrollTop;
    }

    onViewChange = (e) => {
        const { onViewChange, schedulerData } = this.props;
        let viewType = parseInt(e.target.value.charAt(0));
        let showAgenda = e.target.value.charAt(1) === '1';
        let isEventPerspective = e.target.value.charAt(2) === '1';
        onViewChange(schedulerData, { viewType: viewType, showAgenda: showAgenda, isEventPerspective: isEventPerspective });
        this.setState({ ...this.state, spinning: false })
    }

    goNext = () => {
        const { nextClick, schedulerData } = this.props;
        nextClick(schedulerData);
    }

    goBack = () => {
        const { prevClick, schedulerData } = this.props;
        prevClick(schedulerData);
    }

    onSelect = (date) => {
        const { onSelectDate, schedulerData } = this.props;
        onSelectDate(schedulerData, date);
    }
}

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
export { SchedulerData, ViewType, CellUnit, SummaryPos, DnDSource, DnDContext, AddMorePopover, DemoData }
export default Scheduler
