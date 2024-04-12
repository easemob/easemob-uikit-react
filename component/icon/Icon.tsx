import React, { useEffect, ReactElement, ReactNode } from 'react';
import { ConfigContext } from '../config/index';
import { cloneElement } from '../_utils/reactNode';
import { RootContext } from '../../module/store/rootContext';
import classNames from 'classnames';
import './style/style.scss';
import { ICON_TYPES } from './const';
// import { ReactComponent as ShutDown } from '../svgs/logo.svg';
import { ReactComponent as Star } from '../svgs/star.svg';
import { ReactComponent as DoneAll } from '../svgs/doneAll.svg';
import { ReactComponent as Close } from '../svgs/close.svg';
import { ReactComponent as File } from '../svgs/file.svg';
import { ReactComponent as User } from '../svgs/user.svg';
import { ReactComponent as Play } from '../svgs/play.svg';
import { ReactComponent as Ellipsis } from '../svgs/icons/ellipsis_vertical.svg';
import { ReactComponent as Loading } from '../svgs/icons/loading_2.svg';

import { ReactComponent as Doc } from '../svgs/icons/doc.svg';
import { ReactComponent as Wave1 } from '../svgs/icons/wave1_right.svg';
import { ReactComponent as Wave2 } from '../svgs/icons/wave2_right.svg';
import { ReactComponent as Wave3 } from '../svgs/icons/wave3_right.svg';
import { ReactComponent as WaveCircle } from '../svgs/icons/wave_in_circle.svg';
import { ReactComponent as PlayVideo } from '../svgs/icons/triangle_in_circle.svg';
import { ReactComponent as Face } from '../svgs/icons/face.svg';
import { ReactComponent as Cross } from '../svgs/icons/xmark_thick.svg';
import { ReactComponent as CloseThin } from '../svgs/icons/xmark_thin.svg';
import { ReactComponent as AriPlane } from '../svgs/icons/airplane.svg';
import { ReactComponent as ArrowRight } from '../svgs/icons/chevron_right.svg';
import { ReactComponent as ArrowLeft } from '../svgs/icons/chevron_left.svg';
import { ReactComponent as ArrowUp } from '../svgs/icons/chevron_up.svg';
import { ReactComponent as ArrowUpThick } from '../svgs/icons/arrow_up_thick.svg';
import { ReactComponent as ArrowDown } from '../svgs/icons/chevron_down.svg';
import { ReactComponent as ArrowDownThick } from '../svgs/icons/arrow_down_thick.svg';
import { ReactComponent as PlusCircle } from '../svgs/icons/plus_in_circle.svg';
import { ReactComponent as Search } from '../svgs/icons/magnifier.svg';
import { ReactComponent as Delete } from '../svgs/icons/trashdelete.svg';
import { ReactComponent as CloseCircle } from '../svgs/icons/xmark_in_circle_fill.svg';
import { ReactComponent as Img } from '../svgs/icons/img.svg';
import { ReactComponent as ArrowTurnLeft } from '../svgs/icons/arrow_turn_left.svg';
import { ReactComponent as ArrowTurnRight } from '../svgs/icons/arrow_turn_right.svg';
import { ReactComponent as FacePlus } from '../svgs/icons/faceplus.svg';
import { ReactComponent as ArrowBack } from '../svgs/icons/arrow_Uturn_anti_clockwise.svg';
import { ReactComponent as Translation } from '../svgs/icons/a_in_arrows_round.svg';
import { ReactComponent as ModifyMessage } from '../svgs/icons/modifyMsg.svg';
import { ReactComponent as ForwardList } from '../svgs/icons/3lines_n_arrow.svg';
import { ReactComponent as Time } from '../svgs/icons/3pm.svg';
import { ReactComponent as Select } from '../svgs/icons/checked_ellipse.svg';
import { ReactComponent as GoToChat } from '../svgs/icons/gotoMessage.svg';
import { ReactComponent as AddFriend } from '../svgs/icons/person_add_fill.svg';
import { ReactComponent as PersonDoubleFill } from '../svgs/icons/person_double_fill.svg';
import { ReactComponent as PersonSingleFill } from '../svgs/icons/person_single_fill.svg';
import { ReactComponent as Thread } from '../svgs/icons/hashtag_in_bubble.svg';
import { ReactComponent as Envelope } from '../svgs/icons/envelope.svg';
import { ReactComponent as MemberGroup } from '../svgs/all.svg';
import { ReactComponent as Loop } from '../svgs/icons/arrow_round.svg';
import { ReactComponent as CameraArrow } from '../svgs/icons/video_camera_arrow_right.svg';
import { ReactComponent as Mic } from '../svgs/icons/mic.svg';
import { ReactComponent as Gift } from '../svgs/icons/gift.svg';
import { ReactComponent as Bell } from '../svgs/icons/bell.svg';
import { ReactComponent as BellSlash } from '../svgs/icons/bell_slash.svg';
import { ReactComponent as EMPTY } from '../svgs/empty.svg';
import { ReactComponent as MOON } from '../svgs/icons/moon.svg';
import { ReactComponent as SUN } from '../svgs/icons/sun.svg';
import { ReactComponent as POWER } from '../svgs/icons/power.svg';
import { ReactComponent as SPINNER } from '../svgs/icons/spinner.svg';
import { ReactComponent as VERTICAL_ARROW } from '../svgs/icons/vertical_n_arrows.svg';
import { ReactComponent as VIDEO_CAMERA_PLUS } from '../svgs/icons/video_camera_splus.svg';
import { ReactComponent as VIDEO_CAMERA_XMARK } from '../svgs/icons/video_camera_xmark.svg';
import { ReactComponent as BUBBLE_FILL } from '../svgs/icons/bubble_fill.svg';
import { ReactComponent as EXCLAMATION_MARK_IN_CIRCLE } from '../svgs/icons/exclamation_mark_in_circle.svg';
import { ReactComponent as LineArrow } from '../svgs/icons/line_n_arrow.svg';
import { ReactComponent as ArrowLine } from '../svgs/icons/arrow_n_line.svg';
import { ReactComponent as DocOnDoc } from '../svgs/icons/doc_on_doc.svg';
import { ReactComponent as PersonSingleLineFill } from '../svgs/icons/person_single_line_fill.svg';
import { ReactComponent as SlashInBox } from '../svgs/icons/slash_in_box.svg';
import { ReactComponent as Eraser } from '../svgs/icons/eraser.svg';
import { ReactComponent as ArrowSquareRightFill } from '../svgs/icons/arrow_right_square_fill.svg';
import { ReactComponent as ArrowsRound } from '../svgs/icons/arrow_round.svg';
import { ReactComponent as PERSON_ADD } from '../svgs/icons/person_add.svg';
import { ReactComponent as PERSON_ADD_FILL } from '../svgs/icons/person_add_fill.svg';
import { ReactComponent as PERSON_MINUS } from '../svgs/icons/person_minus.svg';
import { ReactComponent as TriangleInRectangleFill } from '../svgs/icons/triangle_in_rectangle_fill.svg';
import { ReactComponent as SpeakerNVerticalBar } from '../svgs/icons/spkeaker_n_vertical_bar.svg';
import { ReactComponent as RoundArrowThick } from '../svgs/icons/round_arrow_thick.svg';
import { ReactComponent as TriangleInRectangle } from '../svgs/icons/triangle_in_rectangle.svg';
import { ReactComponent as Folder } from '../svgs/icons/folder.svg';
import { ReactComponent as Globe } from '../svgs/icons/globe_asia-australia.svg';
import { ReactComponent as CandleInCircleFill } from '../svgs/icons/candle_in_circle_fill.svg';
import { ReactComponent as ExclamationMarkInCircleFill } from '../svgs/icons/exclamation_mark_in_circle_fill.svg';
import { ReactComponent as CheckInCircleFill } from '../svgs/icons/check_in_circle_fill.svg';
import { ReactComponent as Hamburger } from '../svgs/icons/hamburger.svg';
import { ReactComponent as PERSON_MINUS_FILL } from '../svgs/icons/person_minus_fill.svg';
import { ReactComponent as Gear } from '../svgs/icons/gear.svg';
import { ReactComponent as PhonePick } from '../svgs/icons/phone_pick.svg';
import { ReactComponent as VideoCamera } from '../svgs/icons/video_camera.svg';
import { ReactComponent as PlusInCircle } from '../svgs/icons/plus_in_circle.svg';
import { ReactComponent as PlusInCircleFill } from '../svgs/icons/plus_in_circle_fill.svg';
import { ReactComponent as Check } from '../svgs/icons/check.svg';
import { ReactComponent as Check2 } from '../svgs/icons/check_2.svg';
import { ReactComponent as CandleInCircle } from '../svgs/icons/candle_in_circle.svg';
export interface IconProps {
  children?: ReactNode;
  className?: string;
  type: keyof typeof ICON_TYPES;
  width?: string | number;
  height?: string | number;
  color?: string;
  onClick?: (e: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const getIconNode = (type: keyof typeof ICON_TYPES): ReactNode => {
  switch (type) {
    case 'SHUT_DOWN':
      //   return <ShutDown />;
      break;
    case 'STAR':
      return <Star />;
      break;
    case 'DONE_ALL':
      return <DoneAll />;
      break;
    case 'CLOSE':
      return <Close />;
      break;
    case 'FILE':
      return <File />;
      break;
    case 'USER':
      return <User />;
      break;
    case 'PLAY':
      return <Play />;
      break;
    case 'ELLIPSIS':
      return <Ellipsis />;
      break;
    case 'LOADING':
      return <Loading />;
      break;
    case 'DOC':
      return <Doc />;
      break;
    case 'WAVE1':
      return <Wave1 />;
      break;
    case 'WAVE2':
      return <Wave2 />;
      break;
    case 'WAVE3':
      return <Wave3 fill="red" />;
      break;
    case 'CIRCLE_WAVE':
      return <WaveCircle></WaveCircle>;
    case 'PLAY_VIDEO':
      return <PlayVideo></PlayVideo>;
      break;
    case 'FACE':
      return <Face></Face>;
      break;
    case 'CROSS':
      return <Cross></Cross>;
      break;
    case 'AIR_PLANE':
      return <AriPlane></AriPlane>;
      break;
    case 'ARROW_RIGHT':
      return <ArrowRight></ArrowRight>;
      break;
    case 'ARROW_LEFT':
      return <ArrowLeft></ArrowLeft>;
      break;
    case 'ARROW_UP':
      return <ArrowUp></ArrowUp>;
      break;
    case 'ARROW_DOWN':
      return <ArrowDown></ArrowDown>;
      break;
    case 'PLUS_CIRCLE':
      return <PlusCircle></PlusCircle>;
      break;
    case 'SEARCH':
      return <Search></Search>;
      break;
    case 'DELETE':
      return <Delete></Delete>;
      break;
    case 'CLOSE_CIRCLE':
      return <CloseCircle></CloseCircle>;
      break;
    case 'CLOSE_THIN':
      return <CloseThin></CloseThin>;
      break;
    case 'IMG':
      return <Img></Img>;
      break;
    case 'ARROW_TURN_LEFT':
      return <ArrowTurnLeft></ArrowTurnLeft>;
      break;
    case 'ARROW_TURN_RIGHT':
      return <ArrowTurnRight></ArrowTurnRight>;
      break;
    case 'ARROW_UP_THICK':
      return <ArrowUpThick></ArrowUpThick>;
      break;
    case 'ARROW_DOWN_THICK':
      return <ArrowDownThick></ArrowDownThick>;
      break;
    case 'ARROW_BACK':
      return <ArrowBack></ArrowBack>;
      break;
    case 'FACE_PLUS':
      return <FacePlus></FacePlus>;
      break;
    case 'TRANSLATION':
      return <Translation></Translation>;
      break;
    case 'MODIFY_MESSAGE':
      return <ModifyMessage></ModifyMessage>;
      break;
    case 'FORWARD_LIST':
      return <ForwardList></ForwardList>;
      break;
    case 'TIME':
      return <Time></Time>;
      break;
    case 'SELECT':
      return <Select></Select>;
      break;
    case 'GO_TO_CHAT':
      return <GoToChat></GoToChat>;
      break;
    case 'ADD_FRIEND':
      return <AddFriend></AddFriend>;
      break;
    case 'PERSON_DOUBLE_FILL':
      return <PersonDoubleFill></PersonDoubleFill>;
      break;
    case 'PERSON_SINGLE_FILL':
      return <PersonSingleFill></PersonSingleFill>;
      break;
    case 'THREAD':
      return <Thread></Thread>;
      break;
    case 'ENVELOPE':
      return <Envelope></Envelope>;
      break;
    case 'MEMBER_GROUP':
      return <MemberGroup></MemberGroup>;
      break;
    case 'LOOP':
      return <Loop></Loop>;
      break;
    case 'CAMERA_ARROW':
      return <CameraArrow></CameraArrow>;
      break;
    case 'MIC':
      return <Mic></Mic>;
      break;
    case 'GIFT':
      return <Gift></Gift>;
      break;
    case 'BELL':
      return <Bell></Bell>;
      break;
    case 'BELL_SLASH':
      return <BellSlash></BellSlash>;
      break;
    case 'EMPTY':
      return <EMPTY></EMPTY>;
      break;
    case 'MOON':
      return <MOON></MOON>;
      break;
    case 'SUN':
      return <SUN></SUN>;
      break;
    case 'VIDEO_CAMERA_PLUS':
      return <VIDEO_CAMERA_PLUS></VIDEO_CAMERA_PLUS>;
      break;
    case 'VIDEO_CAMERA_XMARK':
      return <VIDEO_CAMERA_XMARK></VIDEO_CAMERA_XMARK>;
      break;
    case 'POWER':
      return <POWER></POWER>;
      break;
    case 'SPINNER':
      return <SPINNER></SPINNER>;
      break;
    case 'VERTICAL_ARROW':
      return <VERTICAL_ARROW></VERTICAL_ARROW>;
      break;
    case 'BUBBLE_FILL':
      return <BUBBLE_FILL></BUBBLE_FILL>;
      break;
    case 'EXCLAMATION_MARK_IN_CIRCLE':
      return <EXCLAMATION_MARK_IN_CIRCLE></EXCLAMATION_MARK_IN_CIRCLE>;
      break;
    case 'LINE_ARROW':
      return <LineArrow></LineArrow>;
      break;
    case 'ARROW_LINE':
      return <ArrowLine></ArrowLine>;
      break;
    case 'DOC_ON_DOC':
      return <DocOnDoc></DocOnDoc>;
      break;
    case 'PERSON_SINGLE_LINE_FILL':
      return <PersonSingleLineFill></PersonSingleLineFill>;
      break;
    case 'SLASH_IN_BOX':
      return <SlashInBox></SlashInBox>;
      break;
    case 'ERASER':
      return <Eraser></Eraser>;
      break;
    case 'ARROW_RIGHT_SQUARE_FILL':
      return <ArrowSquareRightFill></ArrowSquareRightFill>;
      break;
    case 'ARROWS_ROUND':
      return <ArrowsRound></ArrowsRound>;
      break;
    case 'PERSON_ADD':
      return <PERSON_ADD></PERSON_ADD>;
      break;
    case 'PERSON_MINUS':
      return <PERSON_MINUS></PERSON_MINUS>;
      break;
    case 'TRIANGLE_IN_RECTANGLE_FILL':
      return <TriangleInRectangleFill></TriangleInRectangleFill>;
      break;
    case 'SPEAKER_N_VERTICAL_BAR':
      return <SpeakerNVerticalBar></SpeakerNVerticalBar>;
      break;
    case 'ROUND_ARROW_THICK':
      return <RoundArrowThick></RoundArrowThick>;
      //
      break;
    case 'TRIANGLE_IN_RECTANGLE':
      return <TriangleInRectangle></TriangleInRectangle>;
      break;
    case 'FOLDER':
      return <Folder></Folder>;
      break;
    case 'GLOBE':
      return <Globe></Globe>;
      break;
    case 'CANDLE_IN_CIRCLE_FILL':
      return <CandleInCircleFill></CandleInCircleFill>;
      break;
    case 'EXCLAMATION_MARK_IN_CIRCLE_FILL':
      return <ExclamationMarkInCircleFill></ExclamationMarkInCircleFill>;
      break;
    case 'CHECK_IN_CIRCLE_FILL':
      return <CheckInCircleFill></CheckInCircleFill>;
      break;
    case 'HAMBURGER':
      return <Hamburger></Hamburger>;
      break;
    case 'PERSON_MINUS_FILL':
      return <PERSON_MINUS_FILL></PERSON_MINUS_FILL>;
      break;
    case 'GEAR':
      return <Gear></Gear>;
      break;
    case 'PHONE_PICK':
      return <PhonePick></PhonePick>;
      break;
    case 'VIDEO_CAMERA':
      return <VideoCamera></VideoCamera>;
      break;
    case 'PLUS_IN_CIRCLE':
      return <PlusInCircle></PlusInCircle>;
      break;
    case 'PLUS_IN_CIRCLE_FILL':
      return <PlusInCircleFill></PlusInCircleFill>;
      break;
    case 'CHECK':
      return <Check></Check>;
      break;
    case 'CHECK2':
      return <Check2></Check2>;
      break;
    case 'CANDLE_IN_CIRCLE':
      return <CandleInCircle></CandleInCircle>;
      break;
    case 'PERSON_ADD_FILL':
      return <PERSON_ADD_FILL></PERSON_ADD_FILL>;
      break;
    default:
      return '';
      break;
  }
};

const Icon = ({
  className = '',
  type,
  children,
  width,
  height,
  color,
  onClick,
  style,
  ...otherProps
}: IconProps): ReactElement => {
  const { getPrefixCls } = React.useContext(ConfigContext);
  const prefixCls = getPrefixCls('icon');
  const { theme } = React.useContext(RootContext);
  const themeMode = theme?.mode;
  const iconStyle = {
    width: typeof width === 'string' ? width : `${width}px`,
    minWidth: typeof width === 'string' ? width : `${width}px`,
    height: typeof height === 'string' ? height : `${height}px`,
    minHeight: typeof height === 'string' ? height : `${height}px`,
    lineHeight: typeof height === 'string' ? height : `${height}px`,
    fill: color,
  };
  const SVGElement = cloneElement(getIconNode(type), oriProps => ({
    style: {
      ...iconStyle,
      ...oriProps.style,
    },
  }));
  const handleClick = (event: React.MouseEvent) => {
    onClick && onClick(event);
  };
  return (
    <div
      className={classNames(
        prefixCls,
        {
          [`${prefixCls}-${themeMode}`]: !!themeMode,
        },
        className,
      )}
      onClick={handleClick}
      style={{
        ...iconStyle,
        ...style,
      }}
      {...otherProps}
    >
      {children || getIconNode(type)}
    </div>
  );
};

export { Icon };
