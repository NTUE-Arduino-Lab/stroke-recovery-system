/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    addDoc,
    collection,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDocs,
    query,
    where,
    getDoc,
} from 'firebase/firestore';
import _ from '../../util/helper';
import moment from 'moment';

import { ROUTE_PATH, GAME_LEVEL, COUNTDOWM_VALUE } from '../../constants';
import styles from './styles.module.scss';

import { usersRef, recordsRef } from '../../services/firebase';
import wait from '../../util/wait';
import { useStore } from '../../store';

const UserDetail = () => {
    const navigate = useNavigate();
    const { state } = useStore();

    const [user, setUser] = useState();
    const [records, setRecords] = useState([]);
    const [isDone, setIsDone] = useState(false);

    const [selectedRecordId, setSelectedRecordId] = useState();
    const [selectedRecord, setSelectedRecord] = useState();

    const [selectedRecordIdLevel1, setSelectedRecordIdLevel1] = useState([]);
    const [selectedRecordIdLevel2, setSelectedRecordIdLevel2] = useState([]);
    const [selectedRecordIdLevel3, setSelectedRecordIdLevel3] = useState([]);

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        fetchLevelsData();
    }, [selectedRecordId]);

    const init = async () => {
        const user = await fetchUser();
        const records = await fetchUserRecords();

        // 設第一筆為選起來的
        setSelectedRecordId(records[0].id);
        setSelectedRecord(records[0]);

        setUser(user);
        setRecords(records);
        setIsDone(true);
    };

    const fetchLevelsData = async () => {
        const level1Data = await fetchLevelData(GAME_LEVEL.One);
        const level2Data = await fetchLevelData(GAME_LEVEL.Two);
        const level3Data = await fetchLevelData(GAME_LEVEL.Three);

        setSelectedRecordIdLevel1(level1Data);
        setSelectedRecordIdLevel2(level2Data);
        setSelectedRecordIdLevel3(level3Data);
    };

    const fetchLevelData = async (level) => {
        const q = query(collection(recordsRef, selectedRecordId, level));

        const levelData = [];
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            levelData.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        levelData.sort((a, b) => {
            return a.timeStamp?.toDate?.() - b.timeStamp?.toDate?.();
        });
        levelData.splice(0, 1); // 排除掉第一筆

        console.log(levelData);

        return levelData;
    };

    const fetchUser = async () => {
        const docRef = doc(usersRef, state.currentUser);

        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                throw null;
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    };

    const fetchUserRecords = async () => {
        const q = query(recordsRef, where('user', '==', state.currentUser));
        const querySnapshot = await getDocs(q);

        const records = [];
        querySnapshot.forEach((doc) => {
            records.push({
                ...doc.data(),
                id: doc.id,
            });
        });

        records.sort((a, b) => b.createdTime - a.createdTime);

        return records;
    };

    const onSelectRecord = (id) => {
        const theRecord = records.find((r) => r.id == id);

        setSelectedRecord(theRecord);
        setSelectedRecordId(id);

        // TODO:
        // 儲存當前選的 紀錄 到 selectedRecord
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const levelScore = (level) => {
        if (level === GAME_LEVEL.One) {
            return selectedRecordIdLevel1.filter((sr) => sr.correct == true)
                .length;
        }
        if (level === GAME_LEVEL.Two) {
            return selectedRecordIdLevel2.filter((sr) => sr.correct == true)
                .length;
        }
        if (level === GAME_LEVEL.Three) {
            return selectedRecordIdLevel3.length;
        }
    };

    const levelError = (level) => {
        if (level === GAME_LEVEL.One) {
            return selectedRecordIdLevel1.filter((sr) => sr.correct == false)
                .length;
        }
        if (level === GAME_LEVEL.Two) {
            return selectedRecordIdLevel2.filter((sr) => sr.correct == false)
                .length;
        }
        if (level === GAME_LEVEL.Three) {
            return 0;
        }
    };

    const levelCorrectRate = (level) => {
        let correctCount = levelScore(level);
        let unCorrectCount = levelError(level);

        let levelCorrectRate =
            (correctCount / (correctCount + unCorrectCount)) * 100;
        if (_.isNaN(levelCorrectRate)) {
            return 0;
        } else {
            return levelCorrectRate.toFixed(1);
        }
    };

    const countDownDisplay = () => {
        let min = Math.floor(state.countDownValue / 60);
        let sec = state.countDownValue - min * 60;

        let minDisplay = min < 10 ? '0' + min : min;
        let secDisplay = sec < 10 ? '0' + sec : sec;

        return `${minDisplay}:${secDisplay}`;
    };

    return (
        <div className={styles.container}>
            <legend>醫生端</legend>
            <div>
                <h1>
                    {state.currentUserSerial} {state.currentUserName}
                </h1>
            </div>
            <div className={styles.top}>
                <div className={styles.symptoms}>{user?.situation}</div>
                <div className={styles.back_btn} onClick={goDashboard}>
                    返回
                </div>
                <div className={styles.listWrapper}>
                    {records?.map((e, i) => (
                        <section
                            key={e.id}
                            className={
                                selectedRecordId === e.id ? styles.active : null
                            }
                            onClick={() => onSelectRecord(e.id)}
                        >
                            <span>
                                {moment(e?.createdTime?.toDate()).format(
                                    'YYYY/MM/DD',
                                )}
                            </span>
                            <span>平均分數 {e?.avgScore}</span>
                            <span>平均正確率 {e?.avgCorrectRate}%</span>
                        </section>
                    ))}
                </div>
            </div>

            <div className={styles.bottom}>
                <h2>
                    {moment(selectedRecord?.createdTime?.toDate()).format(
                        'YYYY/MM/DD',
                    )}
                </h2>
                <article>
                    <h3>關卡一</h3>
                    <section>
                        <div>
                            花費時間<span>{countDownDisplay()}</span>
                        </div>
                        <div>
                            得分<span>{levelScore(GAME_LEVEL.One)}</span>
                        </div>
                        <div>左手手部</div>
                        <div>
                            錯誤
                            <span className={styles.error}>
                                {levelError(GAME_LEVEL.One)}
                            </span>
                        </div>
                        <div>
                            正確率
                            <span>{levelCorrectRate(GAME_LEVEL.One)}%</span>
                        </div>
                    </section>
                </article>
                <article>
                    <h3>關卡二</h3>
                    <section>
                        <div>
                            花費時間<span>{countDownDisplay()}</span>
                        </div>
                        <div>
                            得分<span>{levelScore(GAME_LEVEL.Two)}</span>
                        </div>
                        <div>左手手部</div>
                        <div>
                            錯誤
                            <span className={styles.error}>
                                {levelError(GAME_LEVEL.Two)}
                            </span>
                        </div>
                        <div>
                            正確率
                            <span>{levelCorrectRate(GAME_LEVEL.Two)}%</span>
                        </div>
                    </section>
                </article>
                <article>
                    <h3>關卡三</h3>
                    <section>
                        <div>
                            花費時間<span>{countDownDisplay()}</span>
                        </div>
                        <div>
                            得分<span>{levelScore(GAME_LEVEL.Three)}</span>
                        </div>
                        <div>左手手部</div>
                        <div>
                            錯誤
                            <span className={styles.error}>
                                {levelError(GAME_LEVEL.Three)}
                            </span>
                        </div>
                        <div>
                            正確率
                            <span>{levelCorrectRate(GAME_LEVEL.Three)}%</span>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
};

export default UserDetail;
