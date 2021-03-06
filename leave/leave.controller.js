const {sendMail} = require("../util/mailer");

const LeaveModel = require("./leave.model");
const User = require("../authentication/auth.model");
const _ = require("underscore");
const vm = require("v-response");

//request  leave
exports.requestLeave = async (req, res, next) => {
    try {
        const find_user = await User.findById(req.body.staff);
        if (!find_user) {
            return res.status(400)
                .json(vm.ApiResponse(false, 400, 'Invalid user details or unverified account'))
        } else {
            const leaverequestBody = _.extend(req.body, {staff: find_user._id, reason: req.body.reason})
            const createLeaveRequest = await new LeaveModel(leaverequestBody);
            await createLeaveRequest.save();
            const find_manager = await User.findOne({_id: find_user.manager});
            //notify staff manager about leave request
            await sendMail('noreply@leavemanagement', find_manager.email, 'Leave Request', `${find_user.fullname} is requesting for leave`);
            return res.status(200)
                .json(vm.ApiResponse(true, 200, "leave request sent"))
        }
    } catch (e) {
        return next(e);
    }

};

exports.approveLeaveOrRejectLeave = async (req, res, next) => {
    try {
        const findLeave = await LeaveModel.findById(req.query.leave_id);
        const findstaff = await User.findById(findLeave.staff);
        if (!findLeave) {
            return res.status(404)
                .json(vm.ApiResponse(false, 400, 'Leave request not found'))
        } else if (findLeave) {
            if (req.body.approvalstatus === 'approved') {
                await sendMail('noreply@leavemanagement', findstaff.email, 'Leave Approval', `Hello ${findstaff.fullname},your leave request has been approved`);
            } else {
                await sendMail('noreply@leavemanagement', findstaff.email, 'Leave Approval', `Hello ${findstaff.fullname},your leave request has been rejected `);
            }
            findLeave.leave_status = req.body.approvalstatus;
            await findLeave.save();
            return res.status(200)
                .json(vm.ApiResponse(true, 200, "leave request status updated successfully"))
        }
    } catch (e) {
        return next(e);
    }

};