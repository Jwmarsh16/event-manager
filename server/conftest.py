import pytest
from config import app, db
from models import *

@pytest.fixture(scope='module')
def test_client():
    """
    Fixture to create a Flask test client and initialize the database in memory for testing.
    """
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    with app.test_client() as testing_client:
        with app.app_context():
            db.create_all()
            yield testing_client
            db.session.remove()
            db.drop_all()
