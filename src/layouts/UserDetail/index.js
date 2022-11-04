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

import { ROUTE_PATH } from '../../constants';
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

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const user = await fetchUser();
        const records = await fetchUserRecords();

        setUser(user);
        setRecords(records);
        setIsDone(true);
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

        return records;
    };

    const onSelectRecord = (id) => {
        setSelectedRecordId(id);

        // TODO:
        // 儲存當前選的 紀錄 到 selectedRecord
    };

    const goDashboard = () => {
        navigate(ROUTE_PATH.admin_dashbaord);
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
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                        (e, i) => (
                            <section
                                key={i}
                                className={
                                    selectedRecordId === i
                                        ? styles.active
                                        : null
                                }
                                onClick={() => onSelectRecord(i)}
                            >
                                <span>2022/05/03</span>
                                <span>平均分數 1{e}</span>
                                <span>平均正確率60.5%</span>
                            </section>
                        ),
                    )}
                </div>
            </div>

            <div className={styles.bottom}>
                <h2>2022/05/03</h2>
                <article>
                    <h3>關卡一</h3>
                    <section>
                        <div>
                            花費時間<span>10:59</span>
                        </div>
                        <div>
                            得分<span>10</span>
                        </div>
                        <div>左手手部</div>
                        <div>
                            錯誤<span className={styles.error}>2</span>
                        </div>
                        <div>
                            正確率<span>60%</span>
                        </div>
                    </section>
                </article>
                <article>
                    <h3>關卡二</h3>
                    <section>
                        <div>
                            花費時間<span>10:59</span>
                        </div>
                        <div>
                            得分<span>10</span>
                        </div>
                        <div>左手手部</div>
                        <div>
                            錯誤<span className={styles.error}>1</span>
                        </div>
                        <div>
                            正確率<span>60%</span>
                        </div>
                    </section>
                </article>
                <article>
                    <h3>關卡三</h3>
                    <section>
                        <div>
                            花費時間<span>10:59</span>
                        </div>
                        <div>
                            得分<span>10</span>
                        </div>
                        <div>左手手部</div>
                        <div>
                            錯誤<span className={styles.error}>2</span>
                        </div>
                        <div>
                            正確率<span>60%</span>
                        </div>
                    </section>
                </article>
            </div>
        </div>
    );
};

export default UserDetail;
