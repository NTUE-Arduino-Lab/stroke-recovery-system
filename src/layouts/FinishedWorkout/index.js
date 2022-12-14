import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
} from 'firebase/firestore';
import moment from 'moment';
import { DualAxes as LineChart } from '@ant-design/plots';
import {
    Layout,
    Descriptions,
    PageHeader,
    Input,
    Button,
    message,
    Modal,
    Space,
} from 'antd';
import {
    UserOutlined,
    ExclamationCircleOutlined,
    LineChartOutlined,
    EditOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import { StylesManager, Model } from 'survey-core';
import { Survey } from 'survey-react-ui';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';
import _ from '../../util/helper';
import formatWithMoment from '../../util/formatSeconds';
import wait from '../../util/wait';
import configLineChart from '../../util/configLineChart';

import { recordsRef, usersRef, difficultiesRef } from '../../services/firebase';

import SixSurveyJson from '../../assets/surveys/sixSurvey.json';
import COPDSurveyJson from '../../assets/surveys/copdSurvey.json';
import SGRSurveyJson from '../../assets/surveys/sgrSurvey.json';
import BorgScaleSurveyJson from '../../assets/surveys/borgScaleSurvey.json';
import 'survey-core/defaultV2.css';
StylesManager.applyTheme('defaultV2');
const sixSurveyJson = SixSurveyJson;
const copdSurveyJson = COPDSurveyJson;
const sgrSurveyJson = SGRSurveyJson;
const borgScaleSurveyJson = BorgScaleSurveyJson;

const mySurveyCss = {
    text: {
        controlDisabled: 'survey-input-disabled',
    },
    rating: {
        selected: 'survey-rating-selected',
    },
};

const { Content } = Layout;

const FinishedWorkout = () => {
    const navigate = useNavigate();
    const params = useParams();

    const [user, setUser] = useState();
    const [record, setRecord] = useState();
    const [packets, setPackets] = useState([]);
    const [difficulty, setDifficulty] = useState();

    const [isDone, setIsDone] = useState(false);

    // doctor says...
    const [therapist, setTherapist] = useState();
    const [comment, setComment] = useState();

    // ????????????????????????????????????????????????SPO2
    const [safeHRIndex, setSafeHRIndex] = useState();
    const [hrVariabilityIndex, setHRVariabilityIndex] = useState();
    const [spo2, setSpo2] = useState();

    // survey control
    const [surveyModalVisible, setSurveyModalVisible] = useState(false);
    const [curSurveyName, setCurSurveyName] = useState();
    const [survey, setSurvey] = useState(new Model(sixSurveyJson));

    // survey data
    const [sixSurveyData, setSixSurveyData] = useState();
    const [copdSurveyData, setCopdSurveyData] = useState(false);
    const [sgrSurveyData, setSGRSurveyData] = useState(false);
    const [borgScaleSurveyData, setBorgScaleSurveyData] = useState();

    // survey UI related!!
    survey.focusFirstQuestionAutomatic = false;
    survey.showNavigationButtons = false;
    survey.showCompletedPage = false;

    // survey METHODS
    const saveResults = (sender) => {
        const results = sender.data;

        console.log(sender.data);

        if (curSurveyName === '?????????????????????') {
            setSixSurveyData({ ...results, surveyCompleted: true });
        }
        if (curSurveyName === 'copd') {
            setCopdSurveyData({ ...results, surveyCompleted: true });
        }
        if (curSurveyName === 'sgr') {
            setSGRSurveyData({ ...results, surveyCompleted: true });
            console.log(sgrSurveyData);
        }
        if (curSurveyName === 'borgScale') {
            setBorgScaleSurveyData({ ...results, surveyCompleted: true });
        }
    };
    survey.onComplete.add(saveResults);

    const openSurveyModal = (surveyName) => {
        if (surveyName === '?????????????????????') {
            let survey = new Model(sixSurveyJson);

            // 1. ?????????????????????
            // 2. ??????????????????
            // *** TODO: // ????????????:
            // ***       // ????????????????????? ??????????????????????????????
            // ***       // ???????????????: ????????????????????????????????????????????????
            if (sixSurveyData) {
                survey.data = sixSurveyData;
                // survey.mode = 'display'; // ??????????????????????????????
            }
            setSurvey(survey);
        }
        if (surveyName === 'copd') {
            let survey = new Model(copdSurveyJson);

            if (copdSurveyData) {
                survey.data = copdSurveyData;
            }
            setSurvey(survey);
        }
        if (surveyName === 'sgr') {
            let survey = new Model(sgrSurveyJson);

            if (sgrSurveyData) {
                survey.data = sgrSurveyData;
            }
            setSurvey(survey);
        }
        if (surveyName === 'borgScale') {
            let survey = new Model(borgScaleSurveyJson);

            if (borgScaleSurveyData) {
                survey.data = borgScaleSurveyData;
            }
            setSurvey(survey);
        }

        setCurSurveyName(surveyName);
        setSurveyModalVisible(true);
    };

    const onOKSurvey = async () => {
        let error = survey.hasErrors();
        if (error) {
            return;
        }
        survey.doComplete();
        setSurveyModalVisible(false);
    };

    const onCancelSurvey = () => {
        setSurveyModalVisible(false);
    };

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        const packetsRef = collection(recordsRef, params.recordId, 'packets');

        // record
        const recordSnapshot = await getDoc(recordRef);
        const recordData = recordSnapshot.data();
        if (
            recordData.pairId != null ||
            recordData.finishedWorkoutTime == null
        ) {
            alert('???????????????????????????????????????????????????');
            navigate(ROUTE_PATH.admin_dashbaord);
            return;
        }
        const record = {
            ...recordData,
            beginWorkoutTime: recordData.beginWorkoutTime.toDate(),
            finishedWorkoutTime: recordData.finishedWorkoutTime.toDate(),
        };

        // packets
        const packets = [];
        const packetsSnapshot = await getDocs(packetsRef);
        packetsSnapshot.forEach((doc) => {
            packets.push({
                ...doc.data(),
                timeLabel: formatWithMoment(doc.data().time),
            });
        });

        packets.sort((a, b) => a.time - b.time);
        packets.splice(0, 1);

        // user
        const userRef = doc(usersRef, recordData.user);
        const userSnapshot = await getDoc(userRef);
        const user = userSnapshot.data();

        // difficulty
        const difficultyRef = doc(difficultiesRef, recordData.difficulty);
        const diffSnapshot = await getDoc(difficultyRef);
        const difficulty = diffSnapshot.data();

        // therapist & comment
        const therapist = record.therapist ?? '';
        const comment = record.comment ?? '';

        setUser(user);
        setRecord(record);
        setPackets(packets);
        setDifficulty(difficulty);
        setTherapist(therapist);
        setComment(comment);
        setIsDone(true);

        console.log(user);
        // ????????? ????????????????????????
        setSixSurveyData({
            question2: user?.name,
            question3: user?.idNumber,
            question5: moment(record?.beginWorkoutTime).format('L'),
            question9: user?.height + ' cm',
            question10: user?.weight + ' kg',
        });
        setSGRSurveyData({
            question1: {
                text1: user?.idNumber,
                text2: `${difficulty?.name} \n (??????${difficulty?.targetHeartRate}BPM???${difficulty?.targetWorkoutTime}???)`,
            },
            question2: moment(record?.beginWorkoutTime).format('L'),
        });
        setBorgScaleSurveyData({
            question2: `${difficulty?.name} \n (??????${difficulty?.targetHeartRate}BPM???${difficulty?.targetWorkoutTime}???)`,
        });
    };

    // ????????? ????????????????????????
    // const initSurveyData = () => {
    //     console.log(record);
    //     console.log(user);
    //     console.log(difficulty);
    //     setSixSurveyData({
    //         question2: user?.name,
    //         question3: user?.idNumber,
    //         question5: moment(record?.beginWorkoutTime).format('L'),
    //     });
    //     setSGRSurveyData({
    //         question1: {
    //             text1: user?.idNumber,
    //             text2: `${difficulty?.name}\n(???????????????${difficulty?.targetHeartRate}????????????????????????${difficulty?.targetWorkoutTime})`,
    //         },
    //         question2: moment(record?.beginWorkoutTime).format('L'),
    //     });
    // };

    const onFormSubmit = async (e) => {
        e.preventDefault();
        if (_.isEmpty(therapist)) {
            message.error('????????????????????????');
            return;
        }

        if (_.isEmpty(safeHRIndex)) {
            message.error('?????????????????????????????????');
            return;
        }

        if (_.isEmpty(hrVariabilityIndex)) {
            message.error('???????????????????????????');
            return;
        }

        if (_.isEmpty(spo2)) {
            message.error('SPO2');
            return;
        }

        if (
            !(
                sixSurveyData?.surveyCompleted &&
                copdSurveyData?.surveyCompleted &&
                sgrSurveyData?.surveyCompleted &&
                borgScaleSurveyData?.surveyCompleted
            )
        ) {
            message.error('?????????????????????');
            return;
        }

        Modal.confirm({
            title: '???????????????',
            icon: <ExclamationCircleOutlined />,
            content: '???????????????????????????',
            onOk: () => updateTherapistInfo(),
        });
    };

    const updateTherapistInfo = async () => {
        const recordRef = doc(recordsRef, params.recordId);
        await updateDoc(recordRef, {
            therapist: therapist,
            safeHRIndex: safeHRIndex,
            hrVariabilityIndex: hrVariabilityIndex,
            spo2: spo2,
            comment: comment,
            sixSurvey: sixSurveyData,
            borgScaleSurvey: borgScaleSurveyData,
            sgrSurvey: sgrSurveyData,
            copdSurvey: copdSurveyData,
        });

        message.success({ content: '???????????????????????????????????????' });

        await wait(1000);
        navigate(ROUTE_PATH.admin_dashbaord, { replace: true });
    };

    const calWorkoutTime = () => {
        const begin = moment(record.beginWorkoutTime);
        const end = moment(record.finishedWorkoutTime);

        const diff = moment.duration(end.diff(begin)).asMilliseconds();

        console.log(diff);

        const h = ('0' + Math.floor(diff / 3600000)).slice(-2);
        const m = ('0' + Math.floor((diff / 60000) % 60)).slice(-2);
        const s = ('0' + Math.floor((diff / 1000) % 60)).slice(-2);

        let returnStr = '';

        if (h != '00') returnStr += `${h} ?????? `;
        returnStr += `${m} ??? ${s} ???`;

        return returnStr;
    };

    if (!isDone) {
        return (
            <Layout style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="?????????????????????..."
                    />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <Content className="site-layout" style={{ padding: '24px' }}>
                <div className={styles.container}>
                    <PageHeader
                        className={styles.PageHeader}
                        title="??????????????????????????????????????????"
                        subTitle="????????????????????????"
                    />

                    <Descriptions bordered className={styles.descriptions}>
                        <Descriptions.Item label="???????????????" span={2}>
                            {user?.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="?????????????????????">
                            {user?.age}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <div>
                                    ??????????????????
                                    <br />/ ??????????????????
                                </div>
                            }
                        >
                            {calWorkoutTime()}???{difficulty.targetWorkoutTime}{' '}
                            ???
                        </Descriptions.Item>
                        <Descriptions.Item label="??????????????????">
                            {record.beginWorkoutTime.toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="??????????????????">
                            {record.finishedWorkoutTime.toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label="???????????????????????????">
                            20 BPM???30 RPM
                        </Descriptions.Item>
                        <Descriptions.Item label="????????????">
                            23 WATTS
                        </Descriptions.Item>
                        <Descriptions.Item label="?????????????????????">
                            12 CAL
                        </Descriptions.Item>
                        <Descriptions.Item label="????????????">
                            {difficulty.name}
                        </Descriptions.Item>
                        <Descriptions.Item label="????????????">
                            {difficulty.targetHeartRate}
                        </Descriptions.Item>
                        <Descriptions.Item label="????????????">
                            {difficulty.upperLimitHeartRate}
                        </Descriptions.Item>
                        <Descriptions.Item label="RPM??????????????????">
                            <LineChart
                                {...configLineChart(
                                    packets,
                                    record.targetHeartRate,
                                )}
                            />
                        </Descriptions.Item>
                    </Descriptions>

                    <div className={styles.form}>
                        <h3>???????????????????????????</h3>
                        <Space>
                            <Button
                                onClick={() =>
                                    openSurveyModal('?????????????????????')
                                }
                                type="primary"
                                icon={
                                    sixSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                ?????? ?????????????????????
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('copd')}
                                type="primary"
                                icon={
                                    copdSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                ?????? COPD ??????
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('sgr')}
                                type="primary"
                                icon={
                                    sgrSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                ?????? SGR ??????
                            </Button>
                            <Button
                                onClick={() => openSurveyModal('borgScale')}
                                type="primary"
                                icon={
                                    borgScaleSurveyData?.surveyCompleted ? (
                                        <CheckOutlined />
                                    ) : null
                                }
                            >
                                ?????? Borg Scale ??????
                            </Button>
                        </Space>
                    </div>
                    <div className={styles.form}>
                        <h3>?????????????????????????????????????????????</h3>

                        <Input
                            size="large"
                            placeholder="?????????????????????"
                            prefix={<UserOutlined />}
                            value={therapist}
                            onChange={(e) => {
                                setTherapist(e.target.value);
                            }}
                            required={true}
                        />
                        <Input
                            size="large"
                            placeholder="SPO2"
                            prefix={<EditOutlined />}
                            value={spo2}
                            onChange={(e) => {
                                setSpo2(e.target.value);
                            }}
                            style={{ marginTop: 16 }}
                            required={true}
                        />
                        <Input
                            size="large"
                            placeholder="????????????????????????"
                            prefix={<LineChartOutlined />}
                            value={safeHRIndex}
                            onChange={(e) => {
                                setSafeHRIndex(e.target.value);
                            }}
                            style={{ marginTop: 16 }}
                            required={true}
                        />
                        <Input
                            size="large"
                            placeholder="??????????????????"
                            prefix={<LineChartOutlined />}
                            value={hrVariabilityIndex}
                            onChange={(e) => {
                                setHRVariabilityIndex(e.target.value);
                            }}
                            style={{ marginTop: 16 }}
                            required={true}
                        />

                        <Input.TextArea
                            showCount
                            placeholder="??????????????????"
                            maxLength={50}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            style={{ marginTop: 16 }}
                        />

                        <Button
                            onClick={onFormSubmit}
                            type="primary"
                            style={{ marginTop: 16 }}
                        >
                            ????????????????????????
                        </Button>
                    </div>
                </div>
                <Modal
                    width={'70vw'}
                    className="surveyModalStyle" // ??????????????? style ????????????
                    visible={surveyModalVisible}
                    onOk={onOKSurvey}
                    onCancel={onCancelSurvey}
                    destroyOnClose
                    okText="????????????"
                >
                    <Survey
                        id="surveyContainer"
                        model={survey}
                        css={mySurveyCss}
                    />
                </Modal>
            </Content>
        </Layout>
    );
};

export default FinishedWorkout;
