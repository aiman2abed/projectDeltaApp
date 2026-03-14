from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# The connection string to your local PostgreSQL database
SQLALCHEMY_DATABASE_URL = "postgresql://aimanabed@localhost:5432/ProjectDeltaApp"

# Create the SQLAlchemy engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create a session factory to talk to the database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our future database models
Base = declarative_base()