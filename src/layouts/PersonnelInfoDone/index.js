/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

import _ from '../../util/helper';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import Logo from '../../assets/images/page_icon.png';
import CustomModal from '../../components/CustomModal';

import { usersRef } from '../../services/firebase';
import { useStore } from '../../store';
import { message } from 'antd';
import wait from '../../util/wait';

const PersonnelInfoDone = () => {
    const navigate = useNavigate();
    const { state } = useStore();

    const [isDone, setIsDone] = useState(false);

    //
    /// 針對中風復健新增的內容
    ////
    /////
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState();
    //
    ///
    //// id: lhDOmjMXa3v59z89okhy
    /////

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const user = await fetchUser();
        if (!user) {
            message.error('伺服器異常，前往主畫面');
            await wait(3000);
            goDashboard();
        }

        setUser(user);
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

    const goDashboard = async () => {
        navigate(ROUTE_PATH.admin_dashbaord);
    };

    const goWaitingRoom = () => {
        if (!isDone) {
            return;
        }
        navigate(ROUTE_PATH.waiting_room);
    };

    const goGame1Direct = async () => {
        navigate(ROUTE_PATH.game1_direct);
    };

    const goGame2Direct = async () => {
        navigate(ROUTE_PATH.game2_direct);
    };

    const goGame3Direct = async () => {
        navigate(ROUTE_PATH.game3_direct);
    };

    return (
        <div className={styles.container}>
            <div
                style={{
                    background: `url(${Logo})`,
                    width: 258,
                    height: 56,
                    left: 24,
                    top: 20,
                    position: 'absolute',
                    backgroundSize: '100%',
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <legend>醫生端</legend>
            <div className={styles.innerContainer}>
                <div className={styles.grid_wrapper}>
                    <h2 className={styles.title}>
                        序號<span>1325</span>填寫完成
                    </h2>
                    <div className={styles.name}>姓名-{user?.name}</div>
                    <div className={styles.birth}>生日-{user?.birthday}</div>
                    <div className={styles.age}>年齡-{user?.age}</div>
                    <div className={styles.height}>身高-{user?.height}</div>
                    <div className={styles.weight}>體重-{user?.weight}</div>
                    <div className={styles.id}>身分證字號-{user?.idNumber}</div>
                    <div className={styles.record}>
                        病例狀況-{user?.situation}
                    </div>
                </div>

                <div className={styles.cst_btn} onClick={goWaitingRoom}>
                    進行連線
                </div>
                <div className={styles.cst_btn} onClick={goDashboard}>
                    返回主頁
                </div>
            </div>
            <CustomModal
                open={open}
                onClose={() => setOpen(false)}
                overlayColour="rgba(243, 151, 0, 50%)"
            >
                <div className={styles.modal_btn} onClick={goGame1Direct}>
                    圓柱練習
                </div>
                <div className={styles.modal_btn} onClick={goGame2Direct}>
                    多元練習
                </div>
                <div className={styles.modal_btn} onClick={goGame3Direct}>
                    細圓柱練習
                </div>
            </CustomModal>
        </div>
    );
};

export default PersonnelInfoDone;
