from flask import request, make_response, jsonify, redirect, render_template
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies, create_refresh_token, set_refresh_cookies
from flask_wtf.csrf import CSRFProtect, generate_csrf, validate_csrf  # Add CSRF imports
from flask_restful import Resource
from models import User, Event, Group, RSVP, Comment, GroupInvitation, EventInvitation
from config import app, db, api
from datetime import datetime
import json


# Initialize JWT Manager
jwt = JWTManager(app)


@app.after_request
def set_csrf_cookie(response):
    """
    Set a stable CSRF token as an HttpOnly cookie if one isn't already set.
    """
    # Only generate a token if one isn't already present
    if not request.cookies.get("csrf_access_token"):
        csrf_token = generate_csrf()
        response.set_cookie(
            "csrf_access_token",
            csrf_token,
            httponly=True,
            secure=True,
            samesite="Strict",
            max_age=3600  # token lifetime set to 1 hour (adjust as needed)
        )
    return response



@app.route('/api/csrf-token')
def get_csrf_token():
    # Return the CSRF token from the cookie; if absent, generate a new one.
    token = request.cookies.get("csrf_access_token")
    if not token:
        token = generate_csrf()
    return jsonify({"csrf_token": token})



def validate_csrf_token():
    request_csrf_token = request.headers.get('X-CSRF-TOKEN')
    cookie_csrf_token = request.cookies.get("csrf_access_token")
    if not request_csrf_token or request_csrf_token != cookie_csrf_token:
        return {"message": "Invalid CSRF token"}, 403
    try:
        validate_csrf(request_csrf_token)
    except Exception:
        return {"message": "Invalid CSRF token"}, 403



def unset_jwt():
    """
    Clear JWT cookies and redirect to the login page.
    """
    resp = make_response(redirect('/login', 302))
    unset_jwt_cookies(resp)
    return resp

def assign_access_refresh_tokens(user_id, url):
    """
    Generate access and refresh tokens, set them as cookies, and redirect to a specified URL.
    """
    access_token = create_access_token(identity=str(user_id))  # Ensure identity is a string
    refresh_token = create_refresh_token(identity=str(user_id))  # Ensure identity is a string
    resp = make_response(redirect(url, 302))
    set_access_cookies(resp, access_token)
    set_refresh_cookies(resp, refresh_token)
    return resp


@app.route('/')
def serve_index():
    """
    Serve the static index.html file for the root route.
    """
    return app.send_static_file('index.html')


# 🔐 Register Resource (CSRF Protected)
class Register(Resource):
    def post(self):
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            data = request.get_json()

            if not all(k in data for k in ("username", "email", "password")):
                return {"message": "Missing required fields"}, 400

            if User.query.filter_by(username=data['username']).first() or User.query.filter_by(email=data['email']).first():
                return {"message": "Username or email already exists"}, 400

            new_user = User(username=data['username'], email=data['email'])
            new_user.password = data['password']
            db.session.add(new_user)
            db.session.commit()

            access_token = create_access_token(identity=str(new_user.id))
            refresh_token = create_refresh_token(identity=str(new_user.id))

            response = make_response({"message": "User registered successfully"})
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)

            response.status_code = 201
            return response
        except Exception as e:
            app.logger.error(f"Unexpected error: {e}")
            return {"message": "An internal server error occurred"}, 500


# 🔐 Login Resource (CSRF Protected)
class Login(Resource):
    def post(self):
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            data = request.get_json()

            if not all(k in data for k in ("email", "password")):
                return {"message": "Missing required fields"}, 400

            user = User.query.filter_by(email=data['email']).first()
            if user is None or not user.check_password(data['password']):
                return {"message": "Invalid email or password"}, 401

            access_token = create_access_token(identity=str(user.id))
            refresh_token = create_refresh_token(identity=str(user.id))

            response = make_response({
                "user": {"id": user.id},
                "message": "Login successful",
            })
            set_access_cookies(response, access_token)
            set_refresh_cookies(response, refresh_token)

            response.status_code = 200
            return response
        except Exception as e:
            app.logger.error(f"Unexpected error during login: {e}")
            return {"message": "An internal server error occurred"}, 500


# 🔐 Logout Resource
class Logout(Resource):
    @jwt_required()
    def post(self):
        return unset_jwt()


# 🔍 User List (No CSRF Required, Read-Only)
class UserList(Resource):
    def get(self):
        limit = request.args.get('limit', 30)
        query = request.args.get('q', '')

        if query:
            users = User.query.filter(User.username.ilike(f"%{query}%")).limit(limit).all()
        else:
            users = User.query.limit(limit).all()

        serialized_users = [
            user.to_dict(rules=('-events', '-rsvps', '-groups', '-sent_event_invitations', '-received_event_invitations'))
            for user in users
        ]
        return serialized_users, 200


# 🔍 User Profile (No CSRF Required, Read-Only)
class UserProfile(Resource):
    @jwt_required()
    def get(self, user_id=None):
        if user_id:
            user = User.query.get_or_404(user_id)
        else:
            current_user_id = int(get_jwt_identity())
            user = User.query.get_or_404(current_user_id)

        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "groups": [group.to_dict(rules=('-members',)) for group in user.groups],
            "events": [
                {
                    "id": event.id,
                    "name": event.name,
                    "date": event.date.strftime('%Y-%m-%d'),
                    "location": event.location,
                    "description": event.description,
                    "rsvp_status": next(
                        (rsvp.status for rsvp in user.rsvps if rsvp.event_id == event.id),
                        "Needs RSVP"
                    )
                }
                for event in user.events + [
                    invitation.event for invitation in user.received_event_invitations
                    if invitation.status == "Accepted"
                ]
            ]
        }, 200


# 🔐 Delete Profile (CSRF Protected)
class DeleteProfile(Resource):
    @jwt_required()
    def delete(self):
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        current_user_id = int(get_jwt_identity())

        user = User.query.get_or_404(current_user_id)
        try:
            db.session.delete(user)
            db.session.commit()
        except Exception as e:
            return {"message": "Failed to delete user"}, 500

        response = make_response(jsonify({"message": "User deleted successfully"}))
        unset_jwt_cookies(response)
        return response


# 🔍 Event List (GET) and Create Event (POST, CSRF Protected)
class EventList(Resource):
    def get(self):
        limit = request.args.get('limit', 30, type=int)
        query = request.args.get('q', '')

        try:
            if query:
                events = Event.query.filter(Event.name.ilike(f"%{query}%")).limit(limit).all()
            else:
                events = Event.query.limit(limit).all()

            serialized_events = [
                event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))
                for event in events
            ]
            return serialized_events, 200
        except Exception as e:
            return {"message": "Failed to fetch events", "details": str(e)}, 500

    @jwt_required()
    def post(self):
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if not all(k in data for k in ("name", "date", "location", "description")):
            return {"message": "Missing required fields"}, 400

        try:
            event_date = datetime.strptime(data['date'], "%Y-%m-%dT%H:%M")
        except ValueError:
            return {"message": "Invalid date format, expected YYYY-MM-DDTHH:MM"}, 400

        new_event = Event(
            name=data['name'],
            date=event_date,
            location=data['location'],
            description=data['description'],
            user_id=current_user_id
        )
        db.session.add(new_event)
        db.session.commit()

        return {"message": "Event created successfully"}, 201



# 🔍 Event Detail Resource
class EventDetail(Resource):
    @jwt_required()
    def get(self, event_id):
        """
        Fetch event details.
        """
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)
        rsvps = RSVP.query.filter_by(event_id=event_id).all()

        event_data = event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))
        event_data['rsvps'] = [
            {
                'user_id': rsvp.user.id,
                'username': rsvp.user.username,
                'status': rsvp.status
            }
            for rsvp in rsvps
        ]
        event_data['is_user_invited'] = any(rsvp.user_id == current_user_id for rsvp in rsvps)
        return event_data, 200

    @jwt_required()
    def put(self, event_id):
        """
        Update event details (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)

        # Ensure only the event owner can edit the event
        if event.user_id != current_user_id:
            return {"message": "You do not have permission to update this event"}, 403

        data = request.get_json()
        if 'date' in data:
            try:
                event.date = datetime.strptime(data['date'], "%Y-%m-%dT%H:%M")
            except ValueError:
                return {"message": "Invalid date format, expected YYYY-MM-DDTHH:MM"}, 400

        event.name = data.get('name', event.name)
        event.location = data.get('location', event.location)
        event.description = data.get('description', event.description)

        db.session.commit()
        return {"message": "Event updated successfully", "event": event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))}, 200

    @jwt_required()
    def delete(self, event_id):
        """
        Delete an event (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)

        # Ensure only the event owner can delete it
        if event.user_id != current_user_id:
            return {"message": "You do not have permission to delete this event"}, 403

        db.session.delete(event)
        db.session.commit()
        return {"message": "Event deleted successfully"}, 200


# 🔐 Event Invitation Resource (CSRF Protected)
class EventInvite(Resource):
    @jwt_required()
    def post(self, event_id):
        """
        Invite a user to an event (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if "invited_user_id" not in data:
            return {"message": "Missing invited_user_id"}, 400

        event = Event.query.get_or_404(event_id)

        # Ensure only the event owner can invite users
        if event.user_id != current_user_id:
            return {"message": "You do not have permission to invite users to this event"}, 403

        invited_user = User.query.get_or_404(data['invited_user_id'])

        # Check if the user is already invited
        existing_invitation = EventInvitation.query.filter_by(
            event_id=event.id,
            invitee_id=invited_user.id
        ).first()
        if existing_invitation:
            return {"message": "User is already invited"}, 400

        # Create a new event invitation
        new_invitation = EventInvitation(
            event_id=event.id,
            inviter_id=current_user_id,
            invitee_id=invited_user.id,
            status="Pending"
        )
        db.session.add(new_invitation)
        db.session.commit()

        # Serialize event and invited user
        event_data = event.to_dict(rules=('-user.events', '-rsvps.event', '-comments.event', '-invitations.event'))
        invited_user_data = invited_user.to_dict(rules=('-events', '-groups', '-rsvps', '-sent_event_invitations', '-received_event_invitations'))

        return {
            "message": "User invited successfully",
            "invitation": {
                "id": new_invitation.id,
                "event": event_data,
                "invitee": invited_user_data,
                "status": new_invitation.status
            }
        }, 201


# 🔍 Event Invitations List (CSRF Protected for Deleting)
class EventInvitations(Resource):
    @jwt_required()
    def get(self):
        """
        Get pending event invitations for the current user.
        """
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        try:
            invitations = EventInvitation.query.filter_by(invitee_id=current_user_id, status='Pending').all()

            serialized_invitations = []
            for invite in invitations:
                event_data = invite.event.to_dict(rules=('-invitations', '-rsvps.event', '-comments.event')) if invite.event else None
                inviter_data = invite.inviter.to_dict(rules=('-events', '-groups', '-sent_event_invitations', '-received_event_invitations')) if invite.inviter else None

                serialized_invitations.append({
                    'id': invite.id,
                    'event': event_data,
                    'inviter': inviter_data,
                    'status': invite.status
                })

            return serialized_invitations, 200

        except Exception as e:
            print(f"Error fetching event invitations: {e}")
            return {"message": "Failed to fetch event invitations", "details": str(e)}, 500

    @jwt_required()
    def delete(self):
        """
        Cancel an event invitation (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
            data = request.get_json()
            invite_id = data.get('id')

            if not invite_id:
                return {"message": "Invitation ID is required"}, 400

            # Ensure the inviter is canceling the invitation
            invitation = EventInvitation.query.filter_by(id=invite_id, inviter_id=current_user_id).first()
            if not invitation:
                return {"message": "Invitation not found or unauthorized"}, 404

            db.session.delete(invitation)
            db.session.commit()

            return {"message": "Invitation canceled successfully", "id": invite_id}, 200

        except Exception as e:
            print(f"Error canceling event invitation: {e}")
            return {"message": "Failed to cancel event invitation", "details": str(e)}, 500



# 🔍 Fetch All Invitations for a Specific Event (No CSRF Required, Read-Only)
class EventInvitationsForEvent(Resource):
    @jwt_required()
    def get(self, event_id):
        """
        Retrieve all invitations for a specific event.
        """
        try:
            # Ensure the event exists
            event = Event.query.get_or_404(event_id)

            # Fetch all invitations for the event
            invitations = EventInvitation.query.filter_by(event_id=event_id).all()

            # Serialize the invitations with invitee details and status
            serialized_invitations = [
                {
                    "id": invite.id,
                    "invitee": {
                        "id": invite.invitee.id,
                        "username": invite.invitee.username,
                    },
                    "status": invite.status,
                }
                for invite in invitations
            ]

            return serialized_invitations, 200

        except Exception as e:
            print(f"Error fetching invitations for event {event_id}: {e}")
            return {"message": "Failed to fetch invitations", "details": str(e)}, 500


# 🔍 Fetch Invitation By Criteria (No CSRF Required, Read-Only)
class EventInvitationByCriteria(Resource):
    @jwt_required()
    def get(self):
        """
        Retrieve a specific event invitation by event_id and invitee_id.
        """
        try:
            event_id = request.args.get('event_id', type=int)
            invitee_id = request.args.get('invitee_id', type=int)

            if not event_id or not invitee_id:
                return {"message": "Both event_id and invitee_id are required"}, 400

            invitation = EventInvitation.query.filter_by(event_id=event_id, invitee_id=invitee_id).first()

            if not invitation:
                return {"message": "Invitation not found"}, 404

            return {"id": invitation.id, "status": invitation.status}, 200
        except Exception as e:
            return {"message": "Failed to fetch invitation", "details": str(e)}, 500


# 🔐 Deny Event Invitation (CSRF Protected)
class DenyEventInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        """
        Allows an invitee to deny an event invitation (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
            invitation = EventInvitation.query.get_or_404(invitation_id)

            # Ensure only the invitee can deny the invitation
            if invitation.invitee_id != current_user_id:
                return {"message": "You do not have permission to deny this invitation"}, 403

            # Delete the invitation instead of just updating its status
            db.session.delete(invitation)
            db.session.commit()

            return {"message": "Invitation denied and deleted", "id": invitation_id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500


# 🔐 Accept Event Invitation (CSRF Protected)
class AcceptEventInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        """
        Allows an invitee to accept an event invitation (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
            invitation = EventInvitation.query.get_or_404(invitation_id)

            # Ensure only the invitee can accept the invitation
            if invitation.invitee_id != current_user_id:
                return {"message": "You do not have permission to accept this invitation"}, 403

            # Update invitation status
            invitation.status = 'Accepted'
            db.session.commit()
            return {"id": invitation_id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500


# 🔍 Fetch All Groups (No CSRF Required, Read-Only) / 🔐 Create a Group (CSRF Protected)
class GroupList(Resource):
    def get(self):
        """
        Retrieve a list of groups with optional search.
        """
        limit = request.args.get('limit', 30, type=int)
        query = request.args.get('q', '')

        if query:
            groups = Group.query.filter(Group.name.ilike(f"%{query}%")).limit(limit).all()
        else:
            groups = Group.query.limit(limit).all()

        # Serialize groups with restricted fields to avoid recursion
        return [group.to_dict(rules=('-members.groups', '-invitations.group', '-members.rsvps', '-members.comments')) for group in groups], 200

    @jwt_required()
    def post(self):
        """
        Create a new group (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if not all(k in data for k in ("name", "description")):
            return {"message": "Missing required fields"}, 400

        new_group = Group(
            name=data['name'],
            description=data['description'],
            user_id=current_user_id
        )
        db.session.add(new_group)
        db.session.flush()  # Get the group's ID before committing

        # Add the creator as a member of the group
        creator = User.query.get_or_404(current_user_id)
        new_group.members.append(creator)

        db.session.commit()

        return {
            "message": "Group created successfully",
            "group": new_group.to_dict(rules=('-members', '-invitations'))
        }, 201




# 🔍 Fetch Group Details (No CSRF Required, Read-Only) / 🔐 Delete Group (CSRF Protected)
class GroupDetail(Resource):
    def get(self, group_id):
        """
        Retrieve details of a specific group.
        """
        group = Group.query.get_or_404(group_id)

        # Serialize group and its members with restricted fields to avoid recursion
        group_data = {
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'user_id': group.user_id,
            'members': [
                user.to_dict(rules=('-groups', '-rsvps', '-comments', '-sent_event_invitations', '-received_event_invitations'))
                for user in group.members
            ]
        }
        return group_data, 200

    @jwt_required()
    def delete(self, group_id):
        """
        Delete a group (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        group = Group.query.get_or_404(group_id)

        # Ensure only the group owner can delete it
        if group.user_id != current_user_id:
            return {"message": "You do not have permission to delete this group"}, 403

        db.session.delete(group)
        db.session.commit()
        return {"message": "Group deleted successfully"}, 200


# 🔐 Invite User to Group (CSRF Protected)
class GroupInvite(Resource):
    @jwt_required()
    def post(self, group_id):
        """
        Invite a user to a group (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        data = request.get_json()
        if "invited_user_id" not in data:
            return {"message": "Missing invited_user_id"}, 400

        group = Group.query.get_or_404(group_id)

        # Ensure only the group owner can invite users
        if group.user_id != current_user_id:
            return {"message": "You do not have permission to invite users to this group"}, 403

        invited_user = User.query.get_or_404(data['invited_user_id'])

        # Check if the user is already a group member
        if invited_user in group.members:
            return {"message": "User is already a group member"}, 400

        # Check if the user is already invited
        existing_invitation = GroupInvitation.query.filter_by(
            group_id=group.id, invited_user_id=invited_user.id
        ).first()
        if existing_invitation:
            return {"message": "User is already invited"}, 400

        # Create a new group invitation
        new_invitation = GroupInvitation(
            group_id=group.id,
            inviter_id=current_user_id,
            invited_user_id=invited_user.id,
            status="Pending"
        )
        db.session.add(new_invitation)
        db.session.commit()

        # Serialize the invitation data
        invitation_data = new_invitation.to_dict(rules=('-group.invitations', '-inviter.sent_group_invitations', '-invitee.received_group_invitations'))
        return {"message": "Group invitation sent successfully", "invitation": invitation_data}, 201


# 🔍 Fetch Group Invitations (No CSRF Required, Read-Only) / 🔐 Cancel Group Invitation (CSRF Protected)
class GroupInvitations(Resource):
    @jwt_required()
    def get(self):
        """
        Retrieve pending group invitations for the current user.
        """
        current_user_id = int(get_jwt_identity())
        invitations = GroupInvitation.query.filter_by(invited_user_id=current_user_id, status='Pending').all()

        # Serialize invitations with restricted fields to prevent recursion
        serialized_invitations = [
            {
                'id': invite.id,
                'group': invite.group.to_dict(rules=('-invitations', '-members.groups')),
                'inviter': invite.inviter.to_dict(rules=('-groups', '-sent_group_invitations', '-received_group_invitations'))
            }
            for invite in invitations
        ]
        return serialized_invitations, 200

    @jwt_required()
    def delete(self):
        """
        Cancel a group invitation (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
            data = request.get_json()

            if "id" not in data:
                return {"message": "Invitation ID is required"}, 400

            # Find the invitation by ID and ensure the current user is the inviter
            invitation = GroupInvitation.query.filter_by(
                id=data['id'], inviter_id=current_user_id
            ).first()

            if not invitation:
                return {"message": "Invitation not found or unauthorized"}, 404

            # Delete the invitation
            db.session.delete(invitation)
            db.session.commit()

            return {"message": "Invitation canceled successfully", "id": invitation.id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500



# 🔍 Fetch Group Invitations (No CSRF Required, Read-Only)
class GroupInvitationsForGroup(Resource):
    @jwt_required()
    def get(self, group_id):
        """
        Retrieve all invitations for a specific group.
        """
        try:
            # Ensure the group exists
            group = Group.query.get_or_404(group_id)

            # Fetch all invitations for the group
            invitations = GroupInvitation.query.filter_by(group_id=group_id).all()

            # Serialize the invitations with invitee details and status
            serialized_invitations = [
                {
                    "id": invite.id,
                    "invitee": {
                        "id": invite.invitee.id,
                        "username": invite.invitee.username,
                    },
                    "status": invite.status,
                }
                for invite in invitations
            ]

            return serialized_invitations, 200

        except Exception as e:
            print(f"Error fetching invitations for group {group_id}: {e}")
            return {"message": "Failed to fetch invitations", "details": str(e)}, 500


# 🔐 Deny Group Invitation (CSRF Protected)
class DenyGroupInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        """
        Allows an invitee to deny a group invitation (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
            invitation = GroupInvitation.query.get_or_404(invitation_id)

            # Ensure only the invitee can deny the invitation
            if invitation.invited_user_id != current_user_id:
                return {"message": "You do not have permission to deny this invitation"}, 403

            # Update invitation status to "Denied"
            invitation.status = 'Denied'
            db.session.commit()

            return {"id": invitation.id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500


# 🔐 Accept Group Invitation (CSRF Protected)
class AcceptGroupInvitation(Resource):
    @jwt_required()
    def put(self, invitation_id):
        """
        Allows an invitee to accept a group invitation (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
            invitation = GroupInvitation.query.get_or_404(invitation_id)

            # Ensure only the invitee can accept the invitation
            if invitation.invited_user_id != current_user_id:
                return {"message": "You do not have permission to accept this invitation"}, 403

            # Update invitation status to "Accepted"
            invitation.status = 'Accepted'
            user = User.query.get_or_404(current_user_id)
            group = Group.query.get_or_404(invitation.group_id)
            group.members.append(user)
            db.session.commit()

            return {"id": invitation.id}, 200
        except Exception as e:
            return {"message": f"Error: {str(e)}"}, 500


# 🔐 RSVP to Event (CSRF Protected)
class RSVPList(Resource):
    @jwt_required()
    def post(self):
        """
        Allows a user to RSVP to an event (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        data = request.get_json()
        if not all(k in data for k in ("event_id", "status")):
            return {"message": "Missing required fields"}, 400

        event = Event.query.get_or_404(data['event_id'])

        # Ensure the user has been invited and accepted the invitation
        invitation = EventInvitation.query.filter_by(
            event_id=event.id, invitee_id=current_user_id, status="Accepted"
        ).first()
        if not invitation:
            return {"message": "You are not allowed to RSVP for this event"}, 403

        existing_rsvp = RSVP.query.filter_by(event_id=event.id, user_id=current_user_id).first()
        if existing_rsvp:
            existing_rsvp.status = data['status']
        else:
            new_rsvp = RSVP(user_id=current_user_id, event_id=event.id, status=data['status'])
            db.session.add(new_rsvp)

        db.session.commit()
        return {"message": "RSVP updated successfully", "rsvp": existing_rsvp.to_dict() if existing_rsvp else new_rsvp.to_dict()}, 201


# 🔍 Fetch RSVPs for an Event (No CSRF Required, Read-Only)
class EventRSVPs(Resource):
    @jwt_required()
    def get(self, event_id):
        """
        Retrieve RSVPs for a specific event.
        """
        try:
            current_user_id = int(get_jwt_identity())
        except ValueError:
            return {"message": "Invalid user ID in JWT"}, 400

        event = Event.query.get_or_404(event_id)

        # Ensure only the event owner or an invited user can view RSVPs
        if event.user_id != current_user_id and not EventInvitation.query.filter_by(
            event_id=event.id, invitee_id=current_user_id, status="Accepted"
        ).first():
            return {"message": "You are not authorized to view RSVPs for this event"}, 403

        rsvps = RSVP.query.filter_by(event_id=event.id).all()
        serialized_rsvps = [
            rsvp.to_dict(rules=('-user.rsvps', '-event.rsvps')) for rsvp in rsvps
        ]
        return serialized_rsvps, 200




# 🔐 Add a Comment to an Event (CSRF Protected)
class CommentList(Resource):
    @jwt_required()
    def post(self, event_id):
        """
        Allows a user to add a comment to an event (CSRF Protected).
        """
        csrf_error = validate_csrf_token()
        if csrf_error:
            return csrf_error

        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        if not data.get("content"):
            return {"message": "Content is required"}, 400

        new_comment = Comment(
            content=data['content'],
            user_id=current_user_id,
            event_id=event_id
        )
        db.session.add(new_comment)
        db.session.commit()

        # Serialize comment data with restricted fields to avoid recursion
        comment_data = new_comment.to_dict(rules=('-user.comments', '-event.comments'))
        return {"message": "Comment added successfully", "comment": comment_data}, 201


# 🔍 Fetch All Comments for an Event (No CSRF Required, Read-Only)
class EventComments(Resource):
    def get(self, event_id):
        """
        Retrieve all comments for a specific event.
        """
        comments = Comment.query.filter_by(event_id=event_id).all()

        # Serialize comment data with restricted fields to avoid recursion
        serialized_comments = [
            comment.to_dict(rules=('-user.comments', '-event.comments')) for comment in comments
        ]
        return serialized_comments, 200



# Add the resources to the API
api.add_resource(Register, '/api/register')
api.add_resource(Login, '/api/login')
api.add_resource(Logout, '/api/logout')
api.add_resource(UserList, '/api/users')  # Updated to support search
api.add_resource(UserProfile, '/api/profile', '/api/profile/<int:user_id>')
api.add_resource(EventList, '/api/events')  # Updated to support search
api.add_resource(EventDetail, '/api/events/<int:event_id>')
api.add_resource(EventInvite, '/api/events/<int:event_id>/invite')
api.add_resource(EventInvitations, '/api/event_invitations')  # For listing event invitations
api.add_resource(EventInvitationsForEvent, '/api/events/<int:event_id>/invitations')
api.add_resource(EventInvitationByCriteria, '/api/event_invitations/criteria')
api.add_resource(DenyEventInvitation, '/api/event_invitations/<int:invitation_id>/deny')  # For denying an event invitation
api.add_resource(AcceptEventInvitation, '/api/event_invitations/<int:invitation_id>/accept')  # For accepting an event invitation
api.add_resource(GroupList, '/api/groups')  # Updated to support search
api.add_resource(GroupDetail, '/api/groups/<int:group_id>')
api.add_resource(GroupInvite, '/api/groups/<int:group_id>/invite')
api.add_resource(GroupInvitations, '/api/group_invitations')  # For listing group invitations
api.add_resource(GroupInvitationsForGroup, '/api/groups/<int:group_id>/invitations')
api.add_resource(AcceptGroupInvitation, '/api/group_invitations/<int:invitation_id>/accept')  # For accepting a group invitation
api.add_resource(DenyGroupInvitation, '/api/group_invitations/<int:invitation_id>/deny')  # For denying a group invitation
api.add_resource(RSVPList, '/api/rsvps')
api.add_resource(EventRSVPs, '/api/events/<int:event_id>/rsvps')
api.add_resource(CommentList, '/api/events/<int:event_id>/comments')
api.add_resource(EventComments, '/api/events/<int:event_id>/comments')

# Add the resource to handle user profile deletion
api.add_resource(DeleteProfile, '/api/profile/delete')
            

@app.errorhandler(404)
def not_found(e):
    return render_template("index.html")

if __name__ == "__main__":
  app.run(port=5555, debug=True)
