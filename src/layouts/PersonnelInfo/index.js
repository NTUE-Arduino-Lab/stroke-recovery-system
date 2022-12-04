/* eslint-disable no-debugger */
/* eslint-disable no-unreachable */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDocs,
    query,
    where,
    getDoc,
} from 'firebase/firestore';
import { message } from 'antd';
import _ from '../../util/helper';

import { ROUTE_PATH } from '../../constants';
import styles from './styles.module.scss';

import Leave_Icon from '../../assets/images/leave_icon.png';
import Logo from '../../assets/images/page_icon.png';
import CustomModal from '../../components/CustomModal';

import { usersRef } from '../../services/firebase';

import { useStore } from '../../store';
import {
    SET_CUR_USER,
    SET_CUR_USER_NAME,
    SET_CUR_USER_SERIAL,
} from '../../store/actions';

import wait from '../../util/wait';

const PersonnelInfo = () => {
    const navigate = useNavigate();
    const params = useParams();
    const { dispatch, state } = useStore();

    const [isDone, setIsDone] = useState(false);

    //
    /// 針對中風復健新增的內容
    ////
    /////
    const [open, setOpen] = useState(false);
    /////////
    const [name, setName] = useState();
    const [birthday, setBirthday] = useState();
    const [age, setAge] = useState();
    const [height, setHeight] = useState();
    const [weight, setWeight] = useState();
    const [idNumber, setIdNumber] = useState();
    const [situation, setSituation] = useState();

    //
    ///
    ////
    /////
    useEffect(() => {
        if (state.currentUser && params.action == 'edit') {
            init();
        }
    }, []);

    const init = async () => {
        const user = await fetchUser();
        console.log(user);
        setName(user.name);
        setBirthday(user.birthday);
        setAge(user.age);
        setHeight(user.height);
        setWeight(user.weight);
        setIdNumber(user.idNumber);
        setSituation(user.situation);

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

    const goPersonnelInfoDone = async () => {
        navigate(ROUTE_PATH.personnel_info_done);
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

    /// 送出資料
    const onSubmit = async (e) => {
        e.preventDefault();
        console.log(name);
        console.log(birthday);
        console.log(age);
        console.log(height);
        console.log(weight);
        console.log(idNumber);
        console.log(situation);

        if (!name || !birthday || !age || !height || !weight || !idNumber) {
            message.error('有資料未完成');
            return;
        }

        if (state.currentUser && params.action == 'edit') {
            onPatchUser();
        } else {
            onCreateUser();
        }
    };

    const onCreateUser = async () => {
        const targetUserRef = await addDoc(usersRef, {
            name,
            birthday,
            age,
            height,
            weight,
            idNumber,
            situation,
        });
        console.log('Document written with ID: ', targetUserRef.id);
        dispatch({ type: SET_CUR_USER, payload: targetUserRef.id });
        dispatch({ type: SET_CUR_USER_NAME, payload: name });
        dispatch({ type: SET_CUR_USER_SERIAL, payload: idNumber.slice(0, 3) });

        // 成功前往配對畫面;
        goPersonnelInfoDone();
    };

    const onPatchUser = async () => {
        try {
            const currUserRef = doc(usersRef, state.currentUser);
            await updateDoc(currUserRef, {
                name,
                birthday,
                age,
                height,
                weight,
                idNumber,
                situation,
            });

            dispatch({ type: SET_CUR_USER_NAME, payload: name });
            dispatch({ type: SET_CUR_USER_SERIAL, payload: '1325' });
            message.success(`成功更新！`);
        } catch (e) {
            console.log(e);
        }
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
                <div
                    onClick={goDashboard}
                    style={{
                        background: `url(${Leave_Icon})`,
                        width: 84,
                        height: 56,
                        right: 24,
                        top: 12,
                        position: 'absolute',
                        backgroundSize: '100%',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
                <h1>
                    基本資料
                    {state.currentUser && params.action == 'edit'
                        ? '修改'
                        : '填寫'}
                </h1>
                <form className={styles.grid_wrapper} onSubmit={onSubmit}>
                    <label htmlFor="name" className={`${styles.name}`}>
                        <span className={styles.labelWrapper}>姓名</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <label className={`${styles.birth}`}>
                        <span className={styles.labelWrapper}>生日</span>
                        <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                        />
                    </label>
                    <label className={`${styles.age}`}>
                        <span className={styles.labelWrapper}>年齡</span>
                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                        />
                    </label>
                    <label className={`${styles.height}`}>
                        <span className={styles.labelWrapper}>身高(cm)</span>
                        <input
                            type="number"
                            value={height}
                            onChange={(e) => setHeight(e.target.value)}
                        />
                    </label>
                    <label className={`${styles.weight}`}>
                        <span className={styles.labelWrapper}>體重(kg)</span>
                        <input
                            type="number"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                        />
                    </label>
                    <label className={`${styles.id}`}>
                        <span className={styles.labelWrapper}>身分證字號</span>
                        <input
                            type="text"
                            value={idNumber}
                            readOnly={
                                state.currentUser && params.action == 'edit'
                            }
                            onChange={(e) => setIdNumber(e.target.value)}
                        />
                    </label>
                    <label className={`${styles.record}`}>
                        <span className={styles.labelWrapper}>病例狀況</span>
                        <input
                            type="text"
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                        />
                    </label>
                    <input
                        type="submit"
                        className={styles.cst_btn}
                        value="確認送出"
                    />
                </form>
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

export default PersonnelInfo;
