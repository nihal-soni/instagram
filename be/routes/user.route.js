import express from "express";
import { register } from "../controllers/user.controller";

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/:id/profile').get(isAuthenticated, getUserProfile);
router.route('/profile/edit').post(isAuthenticated, );
