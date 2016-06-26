/**
 * Created by abratin on 6/14/16.
 */
exports.StatusCodes = Object.freeze({
  ok:{code:200, status:"ok"},
  badEmail: {code:452, status: "no receipient email"},
  dupEmail: {code:453, status: "email already exists"},
  noCode: {code:454, status: "not a valid code"},
  codeNotFound: {code:455, status: "could not find your code"},
  codeRedeemed: {code: 456, status: "code already redeemed"},
  codeExpired: {code: 457, status: "code Expired"},
  noUserFound: {code:458, status: "user not found"},
  noFilesUploaded: {code:459, status: "no files uploaded"},
  noEmailSent: {code:460, status:"no email was sent"},
  missingPassword: {code:461, status:"You are missing a password"},
  missingConfirmPassword: {code:462, status:"You are missing a confirm password"},
  noPasswordMatch: {code:463, status:"Passwords don't match"},
  serverError: {code:500, status: "unable to process your request"}
});