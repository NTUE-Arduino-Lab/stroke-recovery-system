import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { ROUTE_PATH, ROLES } from '../constants/';

import ProtectedRoutes from './ProtectedRoutes';
import SignIn from '../layouts/SignIn';
import AdminDashboard from '../layouts/AdminDashboard';
import Missing from '../layouts/Missing';
import Unauthorized from '../layouts/Unauthorized';
import PrepareWorkout from '../layouts/PrepareWorkout';
import MonitoringWorkout from '../layouts/MonitoringWorkout';
import UserList from '../layouts/UserList';
import DifficulityList from '../layouts/DifficulityList';
import FinishedWorkout from '../layouts/FinishedWorkout';
import RecordList from '../layouts/RecordList';
import TrainingWeekRecord from '../layouts/TrainingWeekRecord';
import PersonnelInfo from '../layouts/PersonnelInfo';
import PersonnelInfoDone from '../layouts/PersonnelInfoDone';
import Game1Direct from '../layouts/Game1Direct';
import Game2Direct from '../layouts/Game2Direct';
import Game3Direct from '../layouts/Game3Direct';
import Game1Moni from '../layouts/Game1Moni';
import Game2Moni from '../layouts/Game2Moni';
import Game3Moni from '../layouts/Game3Moni';
import Game1Result from '../layouts/Game1Result';
import Game2Result from '../layouts/Game2Result';
import Game3Result from '../layouts/Game3Result';
import UserDetail from '../layouts/UserDetail';
import WaitingRoom from '../layouts/WaitingRoom';

const AppRoutes = () => {
    return (
        <Routes>
            <Route
                path={ROUTE_PATH.home}
                element={<Navigate replace to={ROUTE_PATH.admin_dashbaord} />}
            />
            <Route path={ROUTE_PATH.sign_in} element={<SignIn />} />
            <Route path={ROUTE_PATH.unauthorized} element={<Unauthorized />} />

            {/* only Admin can visit */}
            <Route element={<ProtectedRoutes allowedRoles={[ROLES.Admin]} />}>
                <Route
                    path={ROUTE_PATH.admin_dashbaord}
                    element={<AdminDashboard />}
                />
                <Route
                    path={`${ROUTE_PATH.prepare_workout}/:action`}
                    element={<PrepareWorkout />}
                />
                <Route
                    path={`${ROUTE_PATH.monitoring_workout}/:recordId`}
                    element={<MonitoringWorkout />}
                />
                <Route path={ROUTE_PATH.user_list} element={<UserList />} />
                <Route path={ROUTE_PATH.user_detail} element={<UserDetail />} />
                <Route
                    path={`${ROUTE_PATH.record_list}/:userId`}
                    element={<RecordList />}
                />
                <Route
                    path={ROUTE_PATH.difficulty_list}
                    element={<DifficulityList />}
                />
                <Route
                    path={`${ROUTE_PATH.personnel_info}/:action`}
                    element={<PersonnelInfo />}
                />
                <Route
                    path={ROUTE_PATH.personnel_info_done}
                    element={<PersonnelInfoDone />}
                />
                <Route
                    path={ROUTE_PATH.game1_direct}
                    element={<Game1Direct />}
                />
                <Route
                    path={ROUTE_PATH.game2_direct}
                    element={<Game2Direct />}
                />
                <Route
                    path={ROUTE_PATH.game3_direct}
                    element={<Game3Direct />}
                />
                <Route
                    path={ROUTE_PATH.game1_monitoring}
                    element={<Game1Moni />}
                />
                <Route
                    path={ROUTE_PATH.game2_monitoring}
                    element={<Game2Moni />}
                />
                <Route
                    path={ROUTE_PATH.game3_monitoring}
                    element={<Game3Moni />}
                />
                <Route
                    path={ROUTE_PATH.game1_result}
                    element={<Game1Result />}
                />
                <Route
                    path={ROUTE_PATH.game2_result}
                    element={<Game2Result />}
                />
                <Route
                    path={ROUTE_PATH.game3_result}
                    element={<Game3Result />}
                />
                <Route
                    path={ROUTE_PATH.waiting_room}
                    element={<WaitingRoom />}
                />
                <Route
                    path={`${ROUTE_PATH.finsished_workout}/:recordId`}
                    element={<FinishedWorkout />}
                />
                <Route
                    path={`${ROUTE_PATH.training_week_record}/:userId`}
                    element={<TrainingWeekRecord />}
                />
            </Route>

            {/* catch all */}
            <Route path="*" element={<Missing />} />
        </Routes>
    );
};

export default AppRoutes;
